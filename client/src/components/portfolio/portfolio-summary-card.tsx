import { useEffect, useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { 
  TrendingUp, 
  TrendingDown, 
  BriefcaseIcon,
  InfoIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeFrame } from "@shared/schema";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";

// Colori per il grafico a torta
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9E42FF', '#FF4286', '#42C3FF', '#EBFF42'];

// Custom tooltip per il grafico a torta
const CustomPieTooltip = ({ active, payload }: any) => {
  const { t } = useTranslation();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.percentage}%</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip per il grafico lineare
const CustomLineTooltip = ({ active, payload, label }: any) => {
  const { t } = useTranslation();
  
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
  const { t } = useTranslation();
  
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
          {t(`timeframes.${tf}`)}
        </button>
      ))}
    </div>
  );
};

export default function PortfolioSummaryCard() {
  const { 
    assets, 
    activePortfolio,
    portfolioOverview,
    portfolioChartData,
    activeTimeframe,
    setActiveTimeframe
  } = usePortfolio();
  const { t } = useTranslation();

  const [pieData, setPieData] = useState<{ name: string; symbol: string; value: number; percentage: number }[]>([]);

  // Preparazione dati per il grafico a torta
  useEffect(() => {
    if (assets && assets.length > 0) {
      // Calcola il valore totale
      const totalValue = assets.reduce((total, asset) => total + (asset.value || 0), 0);
      
      // Prepara i dati per il grafico a torta
      const pieChartData = assets.map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        value: asset.value || 0,
        percentage: totalValue > 0 ? Math.round((asset.value || 0) / totalValue * 100) : 0
      }))
      // Filtra gli asset con valore 0
      .filter(item => item.value > 0)
      // Ordina per valore decrescente
      .sort((a, b) => b.value - a.value);
      
      setPieData(pieChartData);
    }
  }, [assets]);

  // Custom formatter per X axis
  const formatXAxis = (tickItem: string) => {
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
  };

  if (!activePortfolio || !portfolioOverview) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-500/5 via-background to-primary/5 border-muted-foreground/20 overflow-hidden relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{t('common.portfolio_summary')}</CardTitle>
            <CardDescription>{t('common.portfolio_overview')}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
            {pieData.length} {t('common.assets')}
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
                <div className="text-sm text-muted-foreground mb-1">{t('common.total_value')}</div>
                <div className="text-2xl font-bold">{formatCurrency(portfolioOverview.totalValue)}</div>
              </div>
              
              {/* Cambio 24h */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('common.change_24h')}</div>
                <div className="flex items-center">
                  <div className={`text-xl font-bold ${portfolioOverview.change24hPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(portfolioOverview.change24h)}
                  </div>
                  <div className={`flex items-center ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    portfolioOverview.change24hPercentage >= 0 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {portfolioOverview.change24hPercentage >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {formatPercentage(portfolioOverview.change24hPercentage)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <InfoIcon className="w-3 h-3" />
                {t('common.updated')} {formatDate(new Date())}
              </div>
            </div>
          </div>
          
          {/* Sezione grafico andamento */}
          <div className="col-span-12 md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-muted-foreground/10">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">{t('common.performance')}</div>
              <TimeframeSelector value={activeTimeframe} onChange={setActiveTimeframe} />
            </div>
            
            {portfolioChartData && portfolioChartData.values.length > 0 ? (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={portfolioChartData.labels.map((date, index) => ({
                      date,
                      value: portfolioChartData.values[index]
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
              <div className="flex items-center justify-center h-36 bg-muted/30 rounded-lg">
                <div className="text-center p-2">
                  <p className="text-muted-foreground text-xs">{t('common.no_data')}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sezione composizione portfolio */}
          <div className="col-span-12 md:col-span-4 p-4">
            <div className="text-sm font-medium mb-2">{t('common.distribution')}</div>
            
            {pieData.length > 0 ? (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={50}
                      innerRadius={25}
                      dataKey="value"
                      stroke="var(--background)"
                      strokeWidth={1}
                      nameKey="name"
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
              <div className="flex items-center justify-center h-36 bg-muted/30 rounded-lg">
                <div className="text-center p-2">
                  <p className="text-muted-foreground text-xs">{t('common.add_assets')}</p>
                </div>
              </div>
            )}
            
            {pieData.length > 0 && (
              <div className="mt-2 overflow-hidden space-y-1">
                {pieData.slice(0, 2).map((asset, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate max-w-[100px]">{asset.name}</span>
                    </div>
                    <span>{asset.percentage}%</span>
                  </div>
                ))}
                {pieData.length > 2 && (
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    + {pieData.length - 2} {t('common.others')}
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