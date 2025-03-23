import { usePortfolio } from "@/hooks/use-portfolio";
import WelcomeScreen from "@/components/welcome-screen";
import PortfolioHeader from "@/components/portfolio/portfolio-header";
import AssetSummary from "@/components/portfolio/asset-summary";

const Assets = () => {
  const { isConnected, isLoading } = usePortfolio();
  
  // If not connected, show welcome screen
  if (!isConnected) {
    return <WelcomeScreen />;
  }
  
  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-500 dark:text-gray-400">Loading asset data...</p>
        </div>
      ) : (
        <>
          <PortfolioHeader />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assets</h1>
          <AssetSummary showAddButton={true} maxAssets={100} />
        </>
      )}
    </div>
  );
};

export default Assets;
