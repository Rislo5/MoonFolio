import { useState, useMemo, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeFrame, timeFrames } from "@shared/schema";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import EnhancedChart from "./enhanced-chart";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Sparkles, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon } from "lucide-react";

// Colors for the pie chart - using vibrant colors to match our new theme
const ASSET_COLORS = [
  "#9333EA", // Purple (Primary)
  "#F97316", // Orange
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

const TimeframeSelector = ({ value, onChange }: { value: TimeFrame, onChange: (tf: TimeFrame) => void }) => {
  return (
    <div className="flex space-x-1 p-1 bg-muted/50 rounded-lg">
      {timeFrames.map((timeframe) => (
        <Button
          key={timeframe}
          size="sm"
          variant={timeframe === value ? "default" : "ghost"}
          className={timeframe === value 
            ? "text-white shadow-sm" 
            : "text-foreground hover:bg-muted"
          }
          onClick={() => onChange(timeframe)}
        >
          {timeframe}
        </Button>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border border-border rounded-lg shadow-md">
        <p className="font-medium mb-1">{payload[0].name}</p>
        <p className="text-lg font-bold text-primary">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm text-muted-foreground">
          {payload[0].payload.percentage.toFixed(1)}% del portfolio
        </p>
      </div>
    );
  }
  return null;
};

const PortfolioCharts = () => {
  const { theme } = useTheme();
  const { 
    assets, 
    portfolioChartData, 
    activeTimeframe, 
    setActiveTimeframe,
    portfolioOverview 
  } = usePortfolio();
  const [isLoading, setIsLoading] = useState(true);

  // Simuliamo caricamento iniziale per migliorare UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  // Transform assets for the pie chart with memoization
  const pieChartData = useMemo(() => {
    if (!assets?.length) return [];
    
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    
    return assets
      .filter(asset => asset.value > 0)
      .map((asset) => ({
        name: asset.symbol.toUpperCase(),
        value: asset.value,
        percentage: (asset.value / totalValue) * 100,
        color: asset.profitLossPercentage >= 0 ? "#10B981" : "#EF4444",
      }))
      .sort((a, b) => b.value - a.value); // Order by value descending
  }, [assets]);

  // Total portfolio value
  const totalPortfolioValue = useMemo(() => {
    if (!assets?.length) return 0;
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Enhanced Portfolio Value Chart - takes 2 columns */}
      <EnhancedChart portfolioValue={totalPortfolioValue} />
      
      {/* Asset Allocation Chart */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Allocazione Assets</CardTitle>
            <Badge variant="outline" className="bg-primary/5">
              <PieChartIcon className="h-3 w-3 mr-1" />
              {pieChartData.length} asset
            </Badge>
          </div>
          <CardDescription>
            {isLoading ? (
              <span className="block h-5 w-32">
                <Skeleton className="h-5 w-32" />
              </span>
            ) : (
              `Valore totale: ${formatCurrency(totalPortfolioValue)}`
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="space-y-2 w-full">
                <Skeleton className="h-[300px] w-full rounded-full" />
              </div>
            </div>
          ) : pieChartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={40}
                    dataKey="value"
                    paddingAngle={1}
                    strokeWidth={2}
                    stroke={theme === "dark" ? "#1E1E2E" : "#FFFFFF"}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ASSET_COLORS[index % ASSET_COLORS.length]}
                        className="drop-shadow-sm hover:opacity-90 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconSize={10}
                    iconType="circle"
                    formatter={(value, entry: any, index) => (
                      <span className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {value} ({pieChartData[index].percentage.toFixed(1)}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col gap-2 items-center justify-center">
              <div className="p-4 rounded-full bg-muted/50">
                <PieChartIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nessun asset disponibile</p>
              <Button variant="outline" size="sm">Aggiungi il tuo primo asset</Button>
            </div>
          )}
          
          {/* Stats below the chart */}
          {!isLoading && pieChartData.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Asset più grande</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{pieChartData[0]?.name}</p>
                  <p className="text-xs">{pieChartData[0]?.percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Diversificazione</p>
                <p className="font-medium">
                  {pieChartData.length > 3 ? "Alta" : pieChartData.length > 1 ? "Media" : "Bassa"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioCharts;
