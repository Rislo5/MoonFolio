import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Portfolio, AssetWithPrice } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Area, AreaChart, XAxis, YAxis } from "recharts";
import { LineChart, BarChart3, Wallet, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c'];

const PortfolioOverviewSummary = () => {
  const { portfolios, assets, isLoading } = usePortfolio();
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange24h, setTotalChange24h] = useState(0);
  const [pieData, setPieData] = useState<any[]>([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [top5Assets, setTop5Assets] = useState<AssetWithPrice[]>([]);

  // Calculate total portfolio value and prepare chart data
  useEffect(() => {
    if (portfolios.length > 0) {
      // Calculate total value across all portfolios
      const total = portfolios.reduce((sum, portfolio) => {
        return sum + (portfolio.totalValue || 0);
      }, 0);
      setTotalValue(total);

      // Create pie chart data for portfolio distribution
      const pieChartData = portfolios.map((portfolio, index) => ({
        name: portfolio.name,
        value: portfolio.totalValue || 0,
        color: COLORS[index % COLORS.length]
      })).filter(item => item.value > 0);
      setPieData(pieChartData);

      // Generate mock line chart data - in a real app this would be fetched from API
      const today = new Date();
      const lineData = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        // Create a slight upward trend with some random variations
        lineData.push({
          date: date.toLocaleDateString(),
          value: total * (0.85 + (0.3 * (30 - i) / 30) + Math.random() * 0.05)
        });
      }
      setLineChartData(lineData);

      // Calculate total change in last 24h
      // For demo purposes, calculating a simple percentage of the total
      // In a real app, this would come from price data API
      setTotalChange24h(total * 0.018); // Approximately 1.8% daily change
    }
  }, [portfolios]);

  // Process assets to get top 5 by value
  useEffect(() => {
    if (assets.length > 0) {
      // Sort assets by value and get top 5
      const sortedAssets = [...assets].sort((a, b) => (b.value || 0) - (a.value || 0));
      setTop5Assets(sortedAssets.slice(0, 5));
    }
  }, [assets]);

  // If there are no portfolios, don't render anything
  if (portfolios.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-md bg-muted/30">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Riepilogo del Patrimonio
        </CardTitle>
        <CardDescription>
          Panoramica di tutti i tuoi portfolio di criptovalute
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Value Summary */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Valore Totale</h3>
              {isLoading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Variazione (24h)</h3>
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className={`text-lg font-semibold flex items-center ${totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalChange24h >= 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                    {formatCurrency(Math.abs(totalChange24h))}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Percentuale (24h)</h3>
                {isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className={`text-lg font-semibold flex items-center ${totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalChange24h >= 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                    {formatPercentage(totalChange24h / (totalValue - totalChange24h) * 100)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Top Assets */}
            <div className="space-y-3 pt-3">
              <h3 className="text-sm font-medium text-muted-foreground border-t pt-3">I tuoi Top Asset</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {top5Assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {asset.imageUrl ? (
                          <img 
                            src={asset.imageUrl} 
                            alt={asset.name} 
                            className="w-6 h-6 rounded-full flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
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
                </div>
              )}
            </div>
          </div>
          
          {/* Charts */}
          <div>
            <Tabs defaultValue="distribution">
              <TabsList className="mb-4">
                <TabsTrigger value="distribution" className="text-xs sm:text-sm">
                  <PieChart className="h-3.5 w-3.5 mr-1" />
                  Distribuzione
                </TabsTrigger>
                <TabsTrigger value="trend" className="text-xs sm:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  Trend
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="distribution" className="h-[300px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                ) : (
                  pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(name) => `Portfolio: ${name}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Nessun dato disponibile</p>
                    </div>
                  )
                )}
              </TabsContent>
              
              <TabsContent value="trend" className="h-[300px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  lineChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={lineChartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.getDate() + '/' + (date.getMonth() + 1);
                          }}
                          interval={5}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => formatCurrency(value, { maximumFractionDigits: 0 })}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(date) => `Data: ${date}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#0088FE" 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Nessun dato disponibile</p>
                    </div>
                  )
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioOverviewSummary;