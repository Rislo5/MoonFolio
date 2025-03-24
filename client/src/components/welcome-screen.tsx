import { useState } from "react";
import { RocketIcon } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";
import { ConnectEnsWalletDialog } from "@/components/portfolio/connect-ens-wallet-dialog";

const WelcomeScreen = () => {
  const { connectEnsWallet } = usePortfolio();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEnsDialogOpen, setIsEnsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"main" | "ens">("main");

  const renderMainScreen = () => (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex items-center justify-center mb-6">
        <RocketIcon className="h-12 w-12 text-primary-DEFAULT dark:text-primary-light" />
      </div>
      <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
        Welcome to Moonfolio
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
        Get Started with Your Portfolio<br />
        Choose how you'd like to manage your crypto investments with our easy-to-use options.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
              Connect ENS Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-5 h-12">
              Track crypto assets linked to your Ethereum Name Service address
            </p>
            <Button 
              className="w-full"
              onClick={() => setIsEnsDialogOpen(true)}
            >
              Connect ENS Wallet
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
              Manual Portfolio
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-5 h-12">
              Create a custom portfolio to track any crypto assets manually
            </p>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Manual Portfolio
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEnsScreen = () => (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setViewMode("main")}>
          ← Back
        </Button>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Connect ENS Wallet
        </h2>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Enter your ENS domain (like 'vitalik.eth') or Ethereum address to view your portfolio data.
        </p>
        
        <Button 
          className="w-full"
          onClick={() => setIsEnsDialogOpen(true)}
        >
          Connect Wallet with ENS
        </Button>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          What is ENS?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Ethereum Name Service (ENS) is like a domain name for your Ethereum address. It allows you to use human-readable names instead of long hexadecimal addresses.
        </p>
      </div>
    </div>
  );
  


  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {viewMode === "main" && renderMainScreen()}
      {viewMode === "ens" && renderEnsScreen()}
      
      {/* Utilizziamo lo stesso componente AddPortfolioDialog usato nella pagina Portfolio */}
      <AddPortfolioDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      
      {/* Dialog per connettere wallet ENS con l'opzione includeInSummary */}
      <ConnectEnsWalletDialog
        open={isEnsDialogOpen}
        onOpenChange={setIsEnsDialogOpen}
      />
    </div>
  );
};

export default WelcomeScreen;
