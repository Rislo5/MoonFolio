import { useEffect, useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { formatCurrency, formatPercentage, shortenAddress, getRelativeTimeString } from "@/lib/utils";

const PortfolioHeader = () => {
  const { activePortfolio, portfolioOverview } = usePortfolio();
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (portfolioOverview?.lastUpdated) {
      const updateTime = () => {
        setLastUpdated(getRelativeTimeString(portfolioOverview.lastUpdated));
      };
      
      updateTime();
      const interval = setInterval(updateTime, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [portfolioOverview?.lastUpdated]);

  if (!activePortfolio) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activePortfolio.isEns 
              ? (activePortfolio.ensName || "ENS Wallet") 
              : activePortfolio.name}
            {activePortfolio.walletAddress && (
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400 ml-2">
                ({shortenAddress(activePortfolio.walletAddress)})
              </span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {lastUpdated || "just now"}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex items-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolioOverview?.totalValue || 0)}
            </div>
            {portfolioOverview?.change24hPercentage !== 0 && (
              <div className={`ml-2 px-2 py-1 text-sm font-medium rounded ${
                portfolioOverview?.change24hPercentage >= 0 
                  ? "text-green-800 bg-green-100 dark:text-green-100 dark:bg-green-800/30" 
                  : "text-red-800 bg-red-100 dark:text-red-100 dark:bg-red-800/30"
              }`}>
                {portfolioOverview?.change24hPercentage >= 0 ? "+" : ""}
                {formatPercentage(portfolioOverview?.change24hPercentage || 0)}
              </div>
            )}
          </div>
          {portfolioOverview?.change24h !== 0 && (
            <p className={`text-gray-500 dark:text-gray-400 text-sm ${
              portfolioOverview?.change24h >= 0 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {portfolioOverview?.change24h >= 0 ? "+" : ""}
              {formatCurrency(portfolioOverview?.change24h || 0)} (24h)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioHeader;
