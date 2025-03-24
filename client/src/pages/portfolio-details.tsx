import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import WelcomeScreen from "@/components/welcome-screen";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BarChart3, 
  CoinsIcon, 
  Calendar, 
  PlusCircle 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import AddAssetDialog from "@/components/portfolio/add-asset-dialog";
import PortfolioSummaryCard from "@/components/portfolio/portfolio-summary-card";
import AssetDetailTable from "@/components/portfolio/asset-detail-table";
import TransactionDetailList from "@/components/portfolio/transaction-detail-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransferAssetDialog } from "@/components/portfolio/transfer-asset-dialog";

export default function PortfolioDetails() {
  const [match, params] = useRoute<{ id: string }>("/portfolios/:id");
  const { 
    portfolios, 
    assets, 
    activePortfolio, 
    setActivePortfolio, 
    portfolioOverview 
  } = usePortfolio();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  useEffect(() => {
    if (match && params.id) {
      const portfolioId = parseInt(params.id);
      // Set the active portfolio if it's not already set
      if (!activePortfolio || activePortfolio.id !== portfolioId) {
        setActivePortfolio(portfolioId);
      }
    } else {
      // If there's no match with the route, return to the dashboard
      navigate("/");
    }
  }, [match, params, activePortfolio, setActivePortfolio, navigate]);
  
  // Function to open the transfer dialog
  const handleOpenTransferDialog = (assetId: number) => {
    setSelectedAssetId(assetId);
    setIsTransferDialogOpen(true);
  };

  // If there's no active portfolio or if we're waiting for loading
  if (!activePortfolio) {
    return <WelcomeScreen />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {activePortfolio.name}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and analyze your portfolio
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!activePortfolio.isEns && (
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={() => setIsAddAssetDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
              Add Asset
            </Button>
          )}
          {portfolios.length > 1 && !activePortfolio.isEns && (
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={() => setIsTransferDialogOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2">
                <path d="M18 8L22 12L18 16" />
                <path d="M2 12H22" />
              </svg>
              Transfer
            </Button>
          )}
          {activePortfolio.isEns && (
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              disabled
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Read-only
            </Button>
          )}
        </div>
      </div>
      
      {/* Portfolio Summary with Integrated Charts */}
      <PortfolioSummaryCard />
      
      {/* Details Section */}
      <div>
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="assets" className="flex items-center">
              <CoinsIcon className="mr-2 h-4 w-4" />
              Asset
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assets" className="mt-0">
            {assets.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <h3 className="text-lg font-medium mb-2">No assets present</h3>
                {activePortfolio.isEns ? (
                  <p className="text-muted-foreground mb-6">
                    No assets detected in this ENS wallet
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6">
                      Add your first asset to start tracking your portfolio
                    </p>
                    <Button onClick={() => setIsAddAssetDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Asset
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <AssetDetailTable />
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-sm text-muted-foreground">
                View and manage all your transactions in this portfolio
              </p>
            </div>
            
            <TransactionDetailList />
          </TabsContent>
        </Tabs>
      </div>
      
      <AddAssetDialog 
        open={isAddAssetDialogOpen} 
        onOpenChange={setIsAddAssetDialogOpen} 
      />
      
      <TransferAssetDialog 
        open={isTransferDialogOpen} 
        onOpenChange={setIsTransferDialogOpen} 
        initialAssetId={selectedAssetId || undefined}
      />
    </div>
  );
}