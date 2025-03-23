import { usePortfolio } from "@/hooks/use-portfolio";
import WelcomeScreen from "@/components/welcome-screen";
import PortfolioHeader from "@/components/portfolio/portfolio-header";
import TransactionHistory from "@/components/portfolio/transaction-history";

const Transactions = () => {
  const { isConnected, isLoading } = usePortfolio();
  
  // If not connected, show welcome screen
  if (!isConnected) {
    return <WelcomeScreen />;
  }
  
  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-500 dark:text-gray-400">Loading transaction data...</p>
        </div>
      ) : (
        <>
          <PortfolioHeader />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Transactions</h1>
          <TransactionHistory showAddButton={true} maxTransactions={100} />
        </>
      )}
    </div>
  );
};

export default Transactions;
