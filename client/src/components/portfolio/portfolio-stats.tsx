import { Asset } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ChartLineUp, Coins, DollarSign } from "lucide-react";

interface PortfolioStatsProps {
  assets: Asset[];
}

export default function PortfolioStats({ assets }: PortfolioStatsProps) {
  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => {
    const value = asset.totalValue || 0;
    return sum + value;
  }, 0);

  // Calculate 24h change in both value and percentage
  let value24hChange = 0;
  let percentage24hChange = 0;

  if (assets.length > 0) {
    // Sum up individual asset 24h changes
    const totalValueYesterday = assets.reduce((sum, asset) => {
      const value = asset.totalValue || 0;
      const change24h = asset.change24h || 0;
      // Calculate yesterday's value by reversing the percentage change
      const valueYesterday = value / (1 + change24h / 100);
      return sum + valueYesterday;
    }, 0);

    value24hChange = totalValue - totalValueYesterday;
    percentage24hChange = totalValueYesterday > 0 
      ? (value24hChange / totalValueYesterday) * 100 
      : 0;
  }

  // Calculate total profit/loss
  const totalProfitLoss = assets.reduce((sum, asset) => {
    const profitLoss = asset.profitLoss || 0;
    return sum + profitLoss;
  }, 0);

  // Calculate total profit/loss percentage
  const totalInvestment = assets.reduce((sum, asset) => {
    const avgPrice = parseFloat(asset.avgPrice);
    const quantity = parseFloat(asset.quantity);
    return sum + (avgPrice * quantity);
  }, 0);

  const totalProfitLossPercentage = totalInvestment > 0 
    ? (totalProfitLoss / totalInvestment) * 100 
    : 0;

  // Count unique chains (For demo, we'll just return a fixed number)
  const chainsCount = 3;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Balance</h3>
            <span className="rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-1">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <div className={`flex items-center mt-2 ${percentage24hChange >= 0 ? "text-green-500" : "text-red-500"}`}>
            <svg
              className={`w-3 h-3 mr-1 ${percentage24hChange >= 0 ? "rotate-0" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span className="text-sm">
              {percentage24hChange >= 0 ? "+" : ""}
              {percentage24hChange.toFixed(2)}% (24h)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Daily Change</h3>
            <span className="rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 p-1">
              <ChartLineUp className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold">
            {value24hChange >= 0 ? "+" : ""}
            {formatCurrency(value24hChange)}
          </div>
          <div className={`flex items-center mt-2 ${percentage24hChange >= 0 ? "text-green-500" : "text-red-500"}`}>
            <svg
              className={`w-3 h-3 mr-1 ${percentage24hChange >= 0 ? "rotate-0" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span className="text-sm">
              {percentage24hChange >= 0 ? "+" : ""}
              {percentage24hChange.toFixed(2)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Assets Count</h3>
            <span className="rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 p-1">
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold">{assets.length}</div>
          <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400">
            <span className="text-sm">Across {chainsCount} chains</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Profit/Loss</h3>
            <span className="rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 p-1">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="text-2xl font-bold">
            {totalProfitLoss >= 0 ? "+" : ""}
            {formatCurrency(totalProfitLoss)}
          </div>
          <div className={`flex items-center mt-2 ${totalProfitLossPercentage >= 0 ? "text-green-500" : "text-red-500"}`}>
            <svg
              className={`w-3 h-3 mr-1 ${totalProfitLossPercentage >= 0 ? "rotate-0" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            <span className="text-sm">
              {totalProfitLossPercentage >= 0 ? "+" : ""}
              {totalProfitLossPercentage.toFixed(2)}% (All Time)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
