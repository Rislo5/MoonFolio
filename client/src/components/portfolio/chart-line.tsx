import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartDataPoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data generator for the chart
const generateSampleData = (days: number, startValue: number, volatility: number) => {
  const data: ChartDataPoint[] = [];
  let currentValue = startValue;
  
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some random movement
    const change = (Math.random() - 0.5) * volatility * currentValue;
    currentValue += change;
    
    // Ensure value doesn't go below a minimum
    currentValue = Math.max(currentValue, startValue * 0.5);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: currentValue
    });
  }
  
  return data;
};

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
        <p className="text-gray-600 dark:text-gray-300 text-sm">{label}</p>
        <p className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }

  return null;
};

type TimeRange = "24h" | "7d" | "30d" | "1y" | "all";

interface PortfolioChartProps {
  portfolioValue: number;
}

export default function PortfolioChart({ portfolioValue }: PortfolioChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  useEffect(() => {
    // Generate sample data based on the selected time range
    let days = 0;
    let volatility = 0;
    
    switch (timeRange) {
      case "24h":
        days = 1;
        volatility = 0.01;
        break;
      case "7d":
        days = 7;
        volatility = 0.02;
        break;
      case "30d":
        days = 30;
        volatility = 0.03;
        break;
      case "1y":
        days = 365;
        volatility = 0.05;
        break;
      case "all":
        days = 730;
        volatility = 0.07;
        break;
    }
    
    setChartData(generateSampleData(days, portfolioValue, volatility));
  }, [timeRange, portfolioValue]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-2">
        <CardTitle>Portfolio Performance</CardTitle>
        <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)} className="mt-4 md:mt-0">
          <TabsList>
            <TabsTrigger value="24h">24H</TabsTrigger>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="all">ALL</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(107, 114, 128, 0.2)" 
                vertical={false} 
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  if (timeRange === "24h") {
                    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
                }}
                tick={{ fill: 'var(--foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                tick={{ fill: 'var(--foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: 'var(--background)' }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
