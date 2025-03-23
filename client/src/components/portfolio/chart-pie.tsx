import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { getRandomColor } from "@/lib/utils";
import { PieChartData, Asset } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PortfolioPieChartProps {
  assets: Asset[];
}

export default function PortfolioPieChart({ assets }: PortfolioPieChartProps) {
  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => {
    const value = asset.totalValue || 0;
    return sum + value;
  }, 0);

  // Prepare data for pie chart
  const pieData: PieChartData[] = assets.map((asset, index) => {
    const value = asset.totalValue || 0;
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    
    return {
      name: asset.name,
      symbol: asset.symbol,
      value,
      percentage,
      color: getRandomColor(index),
    };
  });

  // Sort by value, largest first
  pieData.sort((a, b) => b.value - a.value);

  // Group small allocations into "Others" if needed
  const smallThreshold = 5; // Percentage threshold to group as "Others"
  const mainAssets: PieChartData[] = [];
  let othersValue = 0;

  pieData.forEach((item) => {
    if (item.percentage >= smallThreshold) {
      mainAssets.push(item);
    } else {
      othersValue += item.value;
    }
  });

  // Add "Others" category if needed
  if (othersValue > 0) {
    mainAssets.push({
      name: "Others",
      symbol: "OTHERS",
      value: othersValue,
      percentage: (othersValue / totalValue) * 100,
      color: getRandomColor(mainAssets.length),
    });
  }

  const renderLegend = () => {
    return (
      <div className="mt-4 space-y-2">
        {mainAssets.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
              <span className="text-sm">{entry.symbol}</span>
            </div>
            <span className="text-sm font-medium">{entry.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    );
  };

  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="py-10 text-muted-foreground">
            No assets to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mainAssets}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
              >
                {mainAssets.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {renderLegend()}
      </CardContent>
    </Card>
  );
}
