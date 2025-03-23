import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { generatePortfolioChartData } from "@/lib/api";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";
import { AssetWithPrice, TimeFrame } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  BarChart3, 
  Wallet, 
  PieChart as PieChartIcon, 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  TrendingDown,
  InfoIcon
} from "lucide-react";

// Definizione del tipo ExtendedPortfolio
type ExtendedPortfolio = {
  id: number;
  name: string;
  userId: number | null;
  walletAddress: string | null;
  isEns: boolean | null;
  ensName: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  // Proprietà di runtime aggiunte dalla API
  totalValue?: number;
  assetCount?: number;
  isActive?: boolean;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c'];

// Custom tooltip per il grafico a torta
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.percentage}% del patrimonio</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip per il grafico lineare
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="font-medium">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// Componente timeframe selector
const TimeframeSelector = ({ value, onChange }: { value: TimeFrame, onChange: (tf: TimeFrame) => void }) => {
  return (
    <div className="flex items-center space-x-1">
      {['24h', '7d', '30d', '1y', 'all'].map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf as TimeFrame)}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
            value === tf 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted/80 bg-muted/50'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
};

const PortfolioOverviewSummary = () => {
  const { portfolios, assets, isLoading, activeTimeframe, setActiveTimeframe } = usePortfolio();
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange24h, setTotalChange24h] = useState(0);
  const [totalChangePercentage, setTotalChangePercentage] = useState(0);
  const [pieData, setPieData] = useState<any[]>([]);
  const [top5Assets, setTop5Assets] = useState<AssetWithPrice[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Ottieni i dati del grafico usando React Query
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['/overview-chart', activeTimeframe],
    queryFn: () => generatePortfolioChartData(activeTimeframe),
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: 1000
  });
  
  // Prepara i dati per il grafico lineare
  const lineChartData = chartData ? chartData.labels.map((date, index) => ({
    date,
    value: chartData.values[index]
  })) : [];

  // Funzione per caricare i dati dei portfolio
  const loadPortfolioData = async () => {
    if (portfolios && portfolios.length > 0) {
      try {
        let total = 0;
        let totalChange = 0;
        const portfolioData = [];
        
        // Per ogni portfolio, caricheremo i suoi dati dall'API
        for (const portfolio of portfolios) {
          try {
            const overview = await fetch(`/api/portfolios/${portfolio.id}/overview`).then(res => res.json());
            
            if (overview) {
              portfolioData.push({
                name: portfolio.name,
                id: portfolio.id,
                value: overview.totalValue || 0,
                change24h: overview.change24h || 0,
                percentage: Math.round((overview.totalValue / (overview.totalValue - overview.change24h) * 100) * 10) / 10,
                color: COLORS[portfolioData.length % COLORS.length]
              });
              
              // Accumula i valori totali
              total += overview.totalValue || 0;
              totalChange += overview.change24h || 0;
            }
          } catch (e) {
            console.error(`Errore nel caricamento dell'overview per il portfolio ${portfolio.id}:`, e);
          }
        }
        
        // Calcola la percentuale di variazione totale
        const totalChangePercentage = total > 0 ? (totalChange / (total - totalChange)) * 100 : 0;
        
        // Calcola le percentuali per ogni portfolio rispetto al totale
        const pieChartData = portfolioData.map(portfolio => ({
          ...portfolio,
          percentage: total > 0 ? Math.round((portfolio.value / total) * 1000) / 10 : 0
        })).filter(portfolio => portfolio.value > 0)
          .sort((a, b) => b.value - a.value);
        
        // Aggiorna lo stato
        setTotalValue(total);
        setTotalChange24h(totalChange);
        setTotalChangePercentage(totalChangePercentage);
        setPieData(pieChartData);
        setLastUpdated(new Date());
        
        console.log("Dati portafogli caricati:", pieChartData);
        console.log("Valore totale:", total);
        
      } catch (error) {
        console.error("Errore nel caricamento dei dati dei portfolio:", error);
      }
    }
  };
  
  // Carichiamo i dati ogni volta che cambia la lista dei portfolio
  useEffect(() => {
    loadPortfolioData();
  }, [portfolios]);

  // Processare gli asset per ottenere i top 5 per valore
  useEffect(() => {
    if (assets.length > 0) {
      // Ordina gli asset per valore e prendi i primi 5
      const sortedAssets = [...assets].sort((a, b) => (b.value || 0) - (a.value || 0));
      setTop5Assets(sortedAssets.slice(0, 5));
    }
  }, [assets]);

  // Custom formatter per X axis
  const formatXAxis = (tickItem: string) => {
    try {
      // Formattazione diversa in base al timeframe
      if (activeTimeframe === '24h') {
        // Per 24h, mostra l'ora
        return new Date(tickItem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (activeTimeframe === '7d' || activeTimeframe === '30d') {
        // Per 7d e 30d, mostra giorno/mese
        return new Date(tickItem).toLocaleDateString([], { day: 'numeric', month: 'short' });
      } else {
        // Per 1y e all, mostra mese/anno
        return new Date(tickItem).toLocaleDateString([], { month: 'short', year: '2-digit' });
      }
    } catch (e) {
      return tickItem;
    }
  };

  // Se non ci sono portfolio, non renderizzare nulla
  if (portfolios.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-500/5 via-background to-primary/5 border-muted-foreground/20 overflow-hidden relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Riepilogo del Patrimonio
            </CardTitle>
            <CardDescription>Panoramica di tutti i tuoi portfolio di criptovalute</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
            {portfolios.length} Portfolio
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-0">
          {/* Sezione delle metriche */}
          <div className="col-span-12 md:col-span-4 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-muted-foreground/10">
            <div className="space-y-5">
              {/* Valore totale */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Valore Totale</div>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalValue)}
                </div>
              </div>
              
              {/* Cambio 24h */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Cambio (24h)</div>
                {isLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  <div className="flex items-center">
                    <div className={`text-xl font-bold ${totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(Math.abs(totalChange24h))}
                    </div>
                    <div className={`flex items-center ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      totalChangePercentage >= 0 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {totalChangePercentage >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {formatPercentage(Math.abs(totalChangePercentage))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Top Assets */}
              <div>
                <div className="text-sm text-muted-foreground mb-2 border-t pt-3">I tuoi Top Asset</div>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {top5Assets.slice(0, 3).map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          {asset.imageUrl ? (
                            <img 
                              src={asset.imageUrl} 
                              alt={asset.name} 
                              className="w-5 h-5 rounded-full flex-shrink-0" 
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary text-xs font-medium">
                                {asset.symbol.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-sm">{asset.name}</span>
                          <span className="text-xs text-muted-foreground">{asset.symbol.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-sm">{formatCurrency(asset.value || 0)}</span>
                      </div>
                    ))}
                    
                    {top5Assets.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nessun asset disponibile</p>
                    )}
                    
                    {top5Assets.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center mt-1 pt-1 border-t">
                        + {top5Assets.length - 3} altr{top5Assets.length - 3 > 1 ? "i" : "o"} asset
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <InfoIcon className="w-3 h-3" />
                Aggiornato {formatDate(lastUpdated)}
              </div>
            </div>
          </div>
          
          {/* Sezione grafico andamento */}
          <div className="col-span-12 md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-muted-foreground/10">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium">Andamento</div>
              <TimeframeSelector value={activeTimeframe} onChange={setActiveTimeframe} />
            </div>
            
            {isLoading || isChartLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : lineChartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={lineChartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={formatXAxis}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--primary)" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted/30 rounded-lg">
                <div className="text-center p-2">
                  <p className="text-muted-foreground text-xs">Dati insufficienti</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sezione composizione portfolio */}
          <div className="col-span-12 md:col-span-4 p-4">
            <div className="text-sm font-medium mb-3">Distribuzione Portfolio</div>
            
            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Skeleton className="h-[120px] w-[120px] rounded-full mx-auto" />
              </div>
            ) : pieData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      innerRadius={30}
                      dataKey="value"
                      stroke="var(--background)"
                      strokeWidth={1}
                      nameKey="name"
                      isAnimationActive={true}
                      animationDuration={1000}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted/30 rounded-lg">
                <div className="text-center p-2">
                  <p className="text-muted-foreground text-xs">Aggiungi asset al portfolio</p>
                </div>
              </div>
            )}
            
            {pieData.length > 0 && (
              <div className="mt-2 overflow-hidden space-y-1">
                {pieData.slice(0, 3).map((portfolio, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate max-w-[100px]">{portfolio.name}</span>
                    </div>
                    <span>{portfolio.percentage}%</span>
                  </div>
                ))}
                {pieData.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    + {pieData.length - 3} altr{pieData.length - 3 > 1 ? "i" : "o"} portfolio
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioOverviewSummary;