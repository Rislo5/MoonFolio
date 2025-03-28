import { useState } from "react";
import { Wallet, Coins } from "lucide-react";
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
import { MoonfolioLogo } from "@/components/ui/moonfolio-logo";

const WelcomeScreen = () => {
  const { connectEnsWallet } = usePortfolio();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEnsDialogOpen, setIsEnsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"main" | "ens">("main");

  const renderMainScreen = () => (
    <div className="w-full max-w-lg p-8 bg-background rounded-xl shadow-lg border border-border/50">
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="mb-6 w-32 h-32 flex items-center justify-center">
          <MoonfolioLogo variant="icon" className="w-24 h-24" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-3 text-foreground">
          Welcome to Moonfolio
        </h1>
        <p className="text-center text-muted-foreground max-w-md">
          Get Started with Your Portfolio<br />
          Choose how you'd like to manage your crypto investments with our easy-to-use options.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mt-8">
        <Card className="overflow-hidden border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <CardContent className="p-6 pt-5">
            <div className="flex items-start mb-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-4">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-foreground">
                  Connect ENS Wallet
                </h2>
                <p className="text-muted-foreground mb-5">
                  Track crypto assets linked to your Ethereum Name Service address
                </p>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={() => setIsEnsDialogOpen(true)}
            >
              Connect ENS Wallet
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <CardContent className="p-6 pt-5">
            <div className="flex items-start mb-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 mr-4">
                <Coins className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-foreground">
                  Manual Portfolio
                </h2>
                <p className="text-muted-foreground mb-5">
                  Create a custom portfolio to track any crypto assets manually
                </p>
              </div>
            </div>
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
    <div className="w-full max-w-lg p-8 bg-background rounded-xl shadow-lg border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setViewMode("main")}>
          ← Back
        </Button>
        <div className="h-10 w-10"></div> {/* Spacer for alignment */}
      </div>
      
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="mb-6 w-28 h-28 flex items-center justify-center">
          <MoonfolioLogo variant="icon" className="w-20 h-20" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
          Connect ENS Wallet
        </h2>
        <p className="text-center text-muted-foreground max-w-md mb-6">
          Enter your ENS domain (like 'vitalik.eth') or Ethereum address to view your portfolio data.
        </p>
        
        <Button 
          className="w-full max-w-sm"
          onClick={() => setIsEnsDialogOpen(true)}
        >
          Connect Wallet with ENS
        </Button>
      </div>
      
      <div className="border-t border-border pt-6 mt-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">
            What is ENS?
          </h3>
          <p className="text-sm text-muted-foreground">
            Ethereum Name Service (ENS) is like a domain name for your Ethereum address. It allows you to use human-readable names instead of long hexadecimal addresses.
          </p>
        </div>
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
