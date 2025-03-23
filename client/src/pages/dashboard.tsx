import { usePortfolio } from "@/hooks/use-portfolio";
import WelcomeScreen from "@/components/welcome-screen";
import PortfolioHeader from "@/components/portfolio/portfolio-header";
import PortfolioCharts from "@/components/portfolio/portfolio-charts";
import AssetSummary from "@/components/portfolio/asset-summary";
import TransactionHistory from "@/components/portfolio/transaction-history";

const Dashboard = () => {
  const { isConnected, isLoading } = usePortfolio();
  
  // If not connected, show welcome screen
  if (!isConnected) {
    return <WelcomeScreen />;
  }
  
  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-500 dark:text-gray-400">Loading portfolio data...</p>
        </div>
      ) : (
        <>
          <PortfolioHeader />
          <PortfolioCharts />
          <AssetSummary maxAssets={5} />
          <TransactionHistory maxTransactions={5} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
