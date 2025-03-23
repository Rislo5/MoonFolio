import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { usePortfolio } from "@/hooks/use-portfolio";
import { TooltipProps } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border border-border rounded-lg shadow-md">
        <p className="text-muted-foreground text-xs mb-1">{label}</p>
        <p className="font-bold text-primary text-lg">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.changePercent !== undefined && (
          <div className={`text-xs mt-1 flex items-center ${
            payload[0].payload.changePercent >= 0 
              ? "text-green-500" 
              : "text-red-500"
          }`}>
            {payload[0].payload.changePercent >= 0 ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {formatPercentage(payload[0].payload.changePercent)}
          </div>
        )}
      </div>
    );
  }
  return null;
};

type TimeRange = "24h" | "7d" | "30d" | "1y" | "all";

interface EnhancedChartProps {
  portfolioValue: number;
}

export default function EnhancedChart({ portfolioValue }: EnhancedChartProps) {
  const { theme } = useTheme();
  const { portfolioChartData, portfolioOverview, setActiveTimeframe, activeTimeframe } = usePortfolio();
  const [timeRange, setTimeRange] = useState<TimeRange>(activeTimeframe as TimeRange);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Simuliamo caricamento iniziale per mostrare uno stato di skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Quando cambia il timeframe, mostriamo un'animazione
  useEffect(() => {
    if (!isLoading) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [timeRange, isLoading]);
  
  const handleTimeRangeChange = (range: TimeRange) => {
    // Simuliamo un breve caricamento quando cambia il range
    setIsLoading(true);
    setTimeout(() => {
      setTimeRange(range);
      setActiveTimeframe(range);
      setIsLoading(false);
    }, 300);
  };
  
  // Processa i dati del grafico
  const chartData = useMemo(() => {
    if (!portfolioChartData) return [];
    
    return portfolioChartData.labels.map((date, index) => {
      const value = portfolioChartData.values[index];
      const prevValue = index > 0 ? portfolioChartData.values[index - 1] : value;
      const changePercent = prevValue ? ((value - prevValue) / prevValue) * 100 : 0;
      
      return {
        date,
        value,
        changePercent: Number(changePercent.toFixed(2))
      };
    });
  }, [portfolioChartData]);
  
  // Calcola statistiche aggiuntive
  const stats = useMemo(() => {
    if (!chartData.length) return { min: 0, max: 0, avg: 0 };
    
    const values = chartData.map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  }, [chartData]);
  
  // Calcola il colore del grafico in base all'andamento
  const chartColorScheme = useMemo(() => {
    if (!portfolioOverview) return { stroke: "#8B5CF6", gradient: ["#C084FC", "#8B5CF6"] };
    
    const isPositive = portfolioOverview.change24hPercentage >= 0;
    
    return isPositive
      ? { stroke: "#10B981", gradient: ["#10B981", "#059669"] }
      : { stroke: "#EF4444", gradient: ["#EF4444", "#DC2626"] };
  }, [portfolioOverview]);
  
  return (
    <Card className="col-span-3 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Performance del Portfolio</CardTitle>
              <Badge variant="outline" className="bg-primary/5 text-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                {timeRange}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {isLoading ? (
                <span className="block h-5 w-32">
                  <Skeleton className="h-5 w-32" />
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(portfolioValue)}</span>
                  {portfolioOverview && (
                    <span className={`text-xs flex items-center ${
                      portfolioOverview.change24hPercentage >= 0 
                        ? "text-green-500" 
                        : "text-red-500"
                    }`}>
                      {portfolioOverview.change24hPercentage >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(portfolioOverview.change24hPercentage)}
                    </span>
                  )}
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-1 p-1 bg-muted/50 rounded-lg">
            <TimeRangeButton
              range="24h"
              active={timeRange === "24h"}
              onClick={() => handleTimeRangeChange("24h")}
            />
            <TimeRangeButton
              range="7d"
              active={timeRange === "7d"}
              onClick={() => handleTimeRangeChange("7d")}
            />
            <TimeRangeButton
              range="30d"
              active={timeRange === "30d"}
              onClick={() => handleTimeRangeChange("30d")}
            />
            <TimeRangeButton
              range="1y"
              active={timeRange === "1y"}
              onClick={() => handleTimeRangeChange("1y")}
            />
            <TimeRangeButton
              range="all"
              active={timeRange === "all"}
              onClick={() => handleTimeRangeChange("all")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] w-full mt-4 flex items-center justify-center">
            <div className="space-y-2 w-full">
              <Skeleton className="h-[350px] w-full" />
            </div>
          </div>
        ) : (
          <div className={`h-[350px] w-full mt-4 transition-opacity duration-300 ${
            showAnimation ? "opacity-0" : "opacity-100"
          }`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={chartColorScheme.gradient[0]} 
                      stopOpacity={0.8}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={chartColorScheme.gradient[1]} 
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={theme === "dark" ? "#374151" : "#E5E7EB"} 
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => formatCurrency(value, 'USD', 0)}
                  tick={{ fill: theme === "dark" ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartColorScheme.stroke}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                  activeDot={{ r: 6, stroke: chartColorScheme.stroke, strokeWidth: 2, fill: theme === "dark" ? "#1F2937" : "#FFFFFF" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Statistiche aggiuntive */}
        {!isLoading && chartData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col items-center justify-center p-2 bg-primary/5 rounded-lg">
              <span className="text-xs text-muted-foreground">Min.</span>
              <span className="text-sm font-medium">{formatCurrency(stats.min)}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-primary/5 rounded-lg">
              <span className="text-xs text-muted-foreground">Max.</span>
              <span className="text-sm font-medium">{formatCurrency(stats.max)}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-primary/5 rounded-lg">
              <span className="text-xs text-muted-foreground">Media</span>
              <span className="text-sm font-medium">{formatCurrency(stats.avg)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimeRangeButtonProps {
  range: TimeRange;
  active: boolean;
  onClick: () => void;
}

function TimeRangeButton({ range, active, onClick }: TimeRangeButtonProps) {
  return (
    <button
      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
        active
          ? "bg-primary text-white shadow-md shadow-primary/20"
          : "bg-background text-foreground hover:bg-muted"
      }`}
      onClick={onClick}
    >
      {range}
    </button>
  );
}