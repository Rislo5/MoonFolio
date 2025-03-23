import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchPortfolios, fetchAssets, fetchPortfolioOverview, generatePortfolioChartData } from "@/lib/api";
import { Portfolio } from "@shared/schema";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, InfoIcon, BarChart3 } from "lucide-react";

// Colori per il grafico a torta - palette moderna
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FFC0CB', '#46C2CB', '#FE6B8B'];

// Custom tooltip per il grafico a torta
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.percentage}% del totale</p>
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

export default function PortfolioOverviewSummary() {
  const { portfolios } = usePortfolio();
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [change24h, setChange24h] = useState(0);
  const [change24hPercentage, setChange24hPercentage] = useState(0);
  const [porfolioValuesData, setPortfolioValuesData] = useState<{name: string; value: number; percentage: number}[]>([]);
  const [chartData, setChartData] = useState<{labels: string[]; values: number[]}>({labels: [], values: []});
  
  useEffect(() => {
    async function loadPortfolioData() {
      if (portfolios.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // 1. Aggiorna i dati aggregati
        let totalPortfolioValue = 0;
        let totalChange24h = 0;
        const portfolioValues: {name: string; value: number; percentage: number}[] = [];
        
        // 2. Carica i dettagli di ogni portfolio
        for (const portfolio of portfolios) {
          try {
            const overview = await fetchPortfolioOverview(portfolio.id);
            totalPortfolioValue += overview.totalValue;
            totalChange24h += overview.change24h;
            
            // Aggiungi questo portfolio ai dati del grafico a torta
            if (overview.totalValue > 0) {
              portfolioValues.push({
                name: portfolio.name,
                value: overview.totalValue,
                percentage: 0 // Calcoliamo le percentuali dopo aver calcolato il totale
              });
            }
          } catch (error) {
            console.error(`Errore caricando overview per portfolio ${portfolio.id}:`, error);
          }
        }
        
        // 3. Calcola le percentuali per il grafico a torta
        const portfolioDataWithPercentages = portfolioValues.map(item => ({
          ...item,
          percentage: totalPortfolioValue > 0 
            ? Math.round((item.value / totalPortfolioValue) * 100) 
            : 0
        })).sort((a, b) => b.value - a.value);
        
        // 4. Calcola la percentuale di cambio 24h
        const change24hPercent = totalPortfolioValue > 0 
          ? (totalChange24h / (totalPortfolioValue - totalChange24h)) * 100 
          : 0;
        
        // 5. Genera dati per il grafico lineare (7 giorni)
        const lineChartData = await generatePortfolioChartData("7d");
        
        // 6. Aggiorna lo stato
        setTotalValue(totalPortfolioValue);
        setChange24h(totalChange24h);
        setChange24hPercentage(change24hPercent);
        setPortfolioValuesData(portfolioDataWithPercentages);
        setChartData(lineChartData);
      } catch (error) {
        console.error("Errore caricando i dati di riepilogo:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPortfolioData();
  }, [portfolios]);
  
  // Custom formatter per X axis
  const formatXAxis = (tickItem: string) => {
    return new Date(tickItem).toLocaleDateString([], { day: 'numeric', month: 'short' });
  };
  
  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="bg-background rounded-lg p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="bg-background rounded-lg p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="bg-background rounded-lg p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gradient-to-r from-indigo-500/5 via-background to-primary/5 border-muted-foreground/20 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Riepilogo Generale</CardTitle>
        <CardDescription>Panoramica di tutti i tuoi portfolio</CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-0">
          {/* Sezione delle metriche */}
          <div className="col-span-12 md:col-span-4 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-muted-foreground/10">
            <div className="space-y-5">
              {/* Valore totale */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Valore Totale</div>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              </div>
              
              {/* Cambio 24h */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Cambio (24h)</div>
                <div className="flex items-center">
                  <div className={`text-xl font-bold ${change24hPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(change24h)}
                  </div>
                  <div className={`flex items-center ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    change24hPercentage >= 0 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {change24hPercentage >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {formatPercentage(change24hPercentage)}
                  </div>
                </div>
              </div>
              
              {/* Numero di portfolio */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Portfolio</div>
                <div className="text-xl font-bold">{portfolios.length}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <InfoIcon className="w-3 h-3" />
                Aggiornato {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Sezione grafico andamento */}
          <div className="col-span-12 md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-muted-foreground/10">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Andamento (7 giorni)</div>
            </div>
            
            {chartData && chartData.values.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.labels.map((date, index) => ({
                      date,
                      value: chartData.values[index]
                    }))}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorValue)"
                      activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted/30 rounded-lg">
                <div className="text-center p-3">
                  <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Dati insufficienti</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sezione distribuzione portfolio */}
          <div className="col-span-12 md:col-span-4 p-4">
            <div className="text-sm font-medium mb-2">Distribuzione Portfolio</div>
            
            {porfolioValuesData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porfolioValuesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      innerRadius={30}
                      dataKey="value"
                      stroke="var(--background)"
                      strokeWidth={1}
                      nameKey="name"
                    >
                      {porfolioValuesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted/30 rounded-lg">
                <div className="text-center p-3">
                  <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Nessun portfolio con valore</p>
                </div>
              </div>
            )}
            
            {porfolioValuesData.length > 0 && (
              <div className="mt-2 space-y-1">
                {porfolioValuesData.slice(0, 4).map((portfolio, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate max-w-[120px]">{portfolio.name}</span>
                    </div>
                    <span>{portfolio.percentage}%</span>
                  </div>
                ))}
                {porfolioValuesData.length > 4 && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    + {porfolioValuesData.length - 4} altr{porfolioValuesData.length - 4 > 1 ? "i" : "o"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}