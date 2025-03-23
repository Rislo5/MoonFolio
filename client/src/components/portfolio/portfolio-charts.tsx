import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { TimeFrame } from "@shared/schema";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Styles for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9E42FF', '#FF4286', '#42C3FF', '#EBFF42'];

// Custom tooltip for line chart
const CustomTooltip = ({ active, payload, label }: any) => {
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

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.percentage}% del portafoglio</p>
      </div>
    );
  }
  return null;
};

// TimeframeSelector component per selezionare il timeframe
const TimeframeSelector = ({ value, onChange }: { value: TimeFrame, onChange: (tf: TimeFrame) => void }) => {
  return (
    <div className="flex items-center space-x-1">
      {['24h', '7d', '30d', '1y', 'all'].map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf as TimeFrame)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
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

export default function PortfolioCharts() {
  const { 
    assets, 
    activePortfolio,
    portfolioOverview,
    portfolioChartData, 
    activeTimeframe, 
    setActiveTimeframe 
  } = usePortfolio();

  const [pieData, setPieData] = useState<{ name: string; symbol: string; value: number; percentage: number }[]>([]);

  // Prepare data for pie chart
  useEffect(() => {
    if (assets && assets.length > 0) {
      // Calculate total value
      const totalValue = assets.reduce((total, asset) => total + (asset.value || 0), 0);
      
      // Prepare data for pie chart
      const pieChartData = assets.map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        value: asset.value || 0,
        percentage: totalValue > 0 ? Math.round((asset.value || 0) / totalValue * 100) : 0
      }))
      // Filter out assets with 0 value
      .filter(item => item.value > 0)
      // Sort by value descending
      .sort((a, b) => b.value - a.value);
      
      setPieData(pieChartData);
    }
  }, [assets]);

  // Handle empty or loading state
  if (!activePortfolio) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Andamento Portafoglio</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Composizione Portafoglio</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Custom formatter for X axis
  const formatXAxis = (tickItem: string) => {
    // Format differently based on timeframe
    if (activeTimeframe === '24h') {
      // For 24h, show hour
      return new Date(tickItem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (activeTimeframe === '7d' || activeTimeframe === '30d') {
      // For 7d and 30d, show day/month
      return new Date(tickItem).toLocaleDateString([], { day: 'numeric', month: 'short' });
    } else {
      // For 1y and all, show month/year
      return new Date(tickItem).toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CHART 1: Line Chart for Portfolio Performance */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Andamento Portafoglio</CardTitle>
            <TimeframeSelector value={activeTimeframe} onChange={setActiveTimeframe} />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {portfolioOverview && (
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Valore Totale</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolioOverview.totalValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cambiamento (24h)</p>
                <p className={`text-2xl font-bold ${portfolioOverview.change24hPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(portfolioOverview.change24hPercentage)}
                </p>
              </div>
            </div>
          )}

          {portfolioChartData && portfolioChartData.values.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={portfolioChartData.labels.map((date, index) => ({
                  date,
                  value: portfolioChartData.values[index]
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickFormatter={formatXAxis}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-muted/30 rounded-lg">
              <div className="text-center p-4">
                <p className="text-muted-foreground">Non ci sono abbastanza dati per visualizzare il grafico</p>
                <p className="text-xs text-muted-foreground mt-1">Aggiungi asset o transazioni per vedere l'andamento</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* CHART 2: Pie Chart for Portfolio Composition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Composizione Portafoglio</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={50}
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
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  formatter={(value, entry, index) => (
                    <span className="text-sm" style={{color: 'var(--foreground)'}}>
                      {value} ({pieData[index]?.percentage}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-muted/30 rounded-lg">
              <div className="text-center p-4">
                <p className="text-muted-foreground">Non hai ancora asset nel portafoglio</p>
                <p className="text-xs text-muted-foreground mt-1">Aggiungi asset per visualizzare la composizione</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}