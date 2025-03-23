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

const WelcomeScreen = () => {
  const { connectEnsWallet, createManualPortfolio } = usePortfolio();
  const [ensAddress, setEnsAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleConnectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensAddress.trim()) return;
    
    setIsConnecting(true);
    try {
      await connectEnsWallet(ensAddress);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioName.trim()) return;
    
    setIsCreating(true);
    try {
      await createManualPortfolio(portfolioName);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create portfolio:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="flex items-center justify-center mb-6">
          <RocketIcon className="h-12 w-12 text-primary-DEFAULT dark:text-primary-light" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Welcome to Moonfolio
        </h1>
        
        {/* ENS Wallet Connection Card */}
        <Card className="mb-6 bg-gray-50 dark:bg-gray-900">
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Connect ENS Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enter your ENS domain or Ethereum address to view your portfolio
            </p>
            
            <form onSubmit={handleConnectWallet} className="space-y-4">
              <Input
                type="text"
                placeholder="vitalik.eth or 0x123..."
                value={ensAddress}
                onChange={(e) => setEnsAddress(e.target.value)}
                disabled={isConnecting}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Manual Portfolio Card */}
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Create Manual Portfolio
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Track your crypto holdings by creating a manual portfolio
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

      {/* Create Portfolio Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>
              Give your portfolio a name to get started. You can add assets after creating it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePortfolio}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="portfolio-name" className="text-sm font-medium">
                  Portfolio Name
                </label>
                <Input
                  id="portfolio-name"
                  placeholder="My Crypto Portfolio"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !portfolioName.trim()}>
                {isCreating ? "Creating..." : "Create Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WelcomeScreen;
