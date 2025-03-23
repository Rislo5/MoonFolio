import { useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimeFrame, timeFrames } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const portfolioChartColorScheme = {
  light: {
    line: "#6366F1", // Primary color
    area: "rgba(99, 102, 241, 0.1)", // Primary with low opacity
    grid: "rgba(0, 0, 0, 0.1)",
    text: "rgba(0, 0, 0, 0.7)",
  },
  dark: {
    line: "#818CF8", // Primary light color
    area: "rgba(129, 140, 248, 0.1)", // Primary light with low opacity
    grid: "rgba(255, 255, 255, 0.1)",
    text: "rgba(255, 255, 255, 0.7)",
  },
};

// Colors for the pie chart
const ASSET_COLORS = [
  "#6366F1", // Primary
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6B7280", // Gray
];

const TimeframeSelector = ({ value, onChange }: { value: TimeFrame, onChange: (tf: TimeFrame) => void }) => {
  return (
    <div className="flex space-x-2">
      {timeFrames.map((timeframe) => (
        <Button
          key={timeframe}
          size="sm"
          variant="ghost"
          className={
            timeframe === value 
              ? "bg-primary-light/10 text-primary-DEFAULT dark:text-primary-light" 
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }
          onClick={() => onChange(timeframe)}
        >
          {timeframe}
        </Button>
      ))}
    </div>
  );
};

const PortfolioCharts = () => {
  const { assets, portfolioChartData, activeTimeframe, setActiveTimeframe } = usePortfolio();
  const isDarkMode = document.documentElement.classList.contains("dark");
  const colors = isDarkMode ? portfolioChartColorScheme.dark : portfolioChartColorScheme.light;

  // Transform assets for the pie chart
  const pieChartData = assets
    .filter(asset => asset.value > 0)
    .map((asset, index) => ({
      name: asset.symbol.toUpperCase(),
      value: asset.value,
      percentage: (asset.value / assets.reduce((sum, a) => sum + a.value, 0)) * 100,
    }));

  // Custom tooltip for the line chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <p className="text-sm text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm font-medium text-primary-DEFAULT dark:text-primary-light">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for the pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-primary-DEFAULT dark:text-primary-light">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Prepare chart data
  const lineChartData = portfolioChartData?.labels.map((label, index) => ({
    date: label,
    value: portfolioChartData.values[index],
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Portfolio Value Chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Value</h2>
            <TimeframeSelector value={activeTimeframe} onChange={setActiveTimeframe} />
          </div>
          
          <div className="h-60">
            {portfolioChartData?.labels.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineChartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: colors.text }} 
                    tickLine={{ stroke: colors.grid }}
                    axisLine={{ stroke: colors.grid }} 
                  />
                  <YAxis 
                    tick={{ fill: colors.text }} 
                    tickLine={{ stroke: colors.grid }}
                    axisLine={{ stroke: colors.grid }}  
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={colors.line}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: colors.line }}
                    name="Portfolio Value"
                    fill={colors.area}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Asset Allocation Chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Allocation</h2>
          </div>
          
          <div className="h-60">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={50}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ASSET_COLORS[index % ASSET_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend 
                    formatter={(value, entry: any, index) => (
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {value} ({pieChartData[index].percentage.toFixed(1)}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No assets available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioCharts;
