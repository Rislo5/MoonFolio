import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { fetchPortfolios } from "@/lib/api";
import { Portfolio, AssetWithPrice } from "@shared/schema";

// Estende il tipo Portfolio con la proprietà isActive
type ExtendedPortfolio = Portfolio & {
  isActive?: boolean;
};
import WelcomeScreen from "@/components/welcome-screen";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Wallet, 
  ArrowUpRight, 
  BarChart3,
  LineChart,
  Trash2,
  CoinsIcon,
  Calendar
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";
import { TransferAssetDialog } from "@/components/portfolio/transfer-asset-dialog";
import { DeletePortfolioDialog } from "@/components/portfolio/delete-portfolio-dialog";
import AddAssetDialog from "@/components/portfolio/add-asset-dialog";
import PortfolioCharts from "@/components/portfolio/portfolio-charts";
import AssetDetailTable from "@/components/portfolio/asset-detail-table";
import TransactionDetailList from "@/components/portfolio/transaction-detail-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Format timestamp to readable date
const formatTimestamp = (timestamp: string | Date | null) => {
  if (!timestamp) return "Unknown";
  return formatDate(new Date(timestamp));
};

const Dashboard = () => {
  const { portfolios, assets, isConnected, setActivePortfolio, deletePortfolio } = usePortfolio();
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [overviews, setOverviews] = useState<Record<number, { totalValue: number, assetCount: number }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Funzione per aprire il dialogo di trasferimento
  const handleOpenTransferDialog = (assetId: number) => {
    setSelectedAssetId(assetId);
    setIsTransferDialogOpen(true);
  };
  
  // Calcola il valore totale di tutti i portfoli
  const totalPortfolioValue = Object.values(overviews).reduce((sum, { totalValue }) => sum + totalValue, 0);
  
  // Carica le informazioni sui portfolio
  useEffect(() => {
    const loadPortfolioOverviews = async () => {
      setIsLoading(true);
      try {
        const loadedPortfolios = await fetchPortfolios();
        const overviewsData: Record<number, { totalValue: number, assetCount: number }> = {};
        
        for (const portfolio of loadedPortfolios) {
          try {
            // In un'app reale, qui si farebbe una chiamata API per ottenere i dati di riepilogo
            // Per questa demo, usiamo dati simulati
            const assets = await fetch(`/api/portfolios/${portfolio.id}/assets`).then(res => res.json());
            const overview = await fetch(`/api/portfolios/${portfolio.id}/overview`).then(res => res.json());
            
            overviewsData[portfolio.id] = {
              totalValue: overview.totalValue || 0,
              assetCount: assets.length || 0
            };
          } catch (error) {
            console.error(`Failed to load overview for portfolio ${portfolio.id}:`, error);
            overviewsData[portfolio.id] = { totalValue: 0, assetCount: 0 };
          }
        }
        
        setOverviews(overviewsData);
      } catch (error) {
        console.error("Failed to load portfolios:", error);
        toast({
          title: "Errore",
          description: "Non è stato possibile caricare i dati dei portfolio",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPortfolioOverviews();
  }, [portfolios.length, toast]);
  
  const handlePortfolioSelect = (portfolio: Portfolio) => {
    setActivePortfolio(portfolio.id);
    navigate("/portfolios");
  };
  
  // If no portfolios, show welcome screen
  if (portfolios.length === 0 && !isLoading) {
    return (
      <>
        <WelcomeScreen />
        <AddPortfolioDialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen} />
      </>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Panoramica di tutti i tuoi portfolio di criptovalute
          </p>
        </div>
        <Button 
          onClick={() => setIsAddPortfolioOpen(true)} 
          className="w-full sm:w-auto ml-0 sm:ml-auto gap-1"
          size={isMobile ? "sm" : "default"}
        >
          <PlusCircle className="h-4 w-4" />
          Nuovo Portfolio
        </Button>
      </div>
      
      {/* Riepilogo generale */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-xl">Riepilogo Generale</CardTitle>
          <CardDescription>
            Panoramica di tutti i tuoi portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Valore Totale</h3>
              {isLoading ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
              )}
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Numero di Portfolio</h3>
              {isLoading ? (
                <Skeleton className="h-9 w-8" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold">{portfolios.length}</p>
              )}
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Portfolio Attivo</h3>
              {isLoading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {isConnected ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                      <span className="truncate">{(portfolios as ExtendedPortfolio[]).find(p => p.isActive)?.name || "Nessuno"}</span>
                    </span>
                  ) : (
                    "Nessuno"
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Portfolio manuali */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            Portfolio Manuali
          </h2>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {isLoading ? (
            // Skeleton loading state
            Array(3).fill(0).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24 mb-4" />
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))
          ) : (
            (portfolios as ExtendedPortfolio[]).map((portfolio) => (
              <Card key={portfolio.id} className="overflow-hidden shadow-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg flex justify-between items-center">
                    <span className="truncate mr-2">{portfolio.name}</span>
                    {portfolio.isActive && (
                      <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full whitespace-nowrap">
                        Attivo
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Creato il {formatTimestamp(portfolio.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                    {formatCurrency(overviews[portfolio.id]?.totalValue || 0)}
                  </p>
                  <div className="flex flex-wrap gap-y-2 justify-between items-center text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{overviews[portfolio.id]?.assetCount || 0} asset</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Performance: <span className="text-green-500">+0.0%</span></span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-3 sm:pt-4">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPortfolio(portfolio);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"}
                    onClick={() => handlePortfolioSelect(portfolio)}
                  >
                    Visualizza
                    <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
          
          {/* Add portfolio card */}
          <Card className="overflow-hidden border-dashed bg-muted/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center h-full py-6 sm:py-8">
              <Button
                variant="outline"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 mb-3 sm:mb-4"
                onClick={() => setIsAddPortfolioOpen(true)}
              >
                <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <p className="text-center text-muted-foreground text-sm sm:text-base">
                Aggiungi un nuovo portfolio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sezione Grafici e Statistiche */}
      {isConnected && assets && assets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
              <LineChart className="h-4 w-4 sm:h-5 sm:w-5" />
              Analisi Portfolio
            </h2>
          </div>
          
          <PortfolioCharts />
        </div>
      )}

      {/* Sezione Asset Dettagliata */}
      {isConnected && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Dettaglio Asset
            </h2>
          </div>
          
          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="assets" className="flex items-center">
                <CoinsIcon className="mr-2 h-4 w-4" />
                Asset
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Transazioni
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="mt-0">
              <AssetDetailTable />
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-0">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <p className="text-sm text-muted-foreground">
                  Visualizza e gestisci tutte le tue transazioni in questo portfolio
                </p>
              </div>
              
              <TransactionDetailList />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Sezione Asset */}
      {assets && assets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Asset nel Portfolio Attivo
            </h2>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="bg-background border rounded-lg overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center">
                <h3 className="font-medium truncate">Asset nel Portfolio {(portfolios as ExtendedPortfolio[]).find(p => p.isActive)?.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "sm"} 
                    onClick={() => setIsAddAssetDialogOpen(true)}
                    className="flex-1 sm:flex-initial"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Aggiungi Asset
                  </Button>
                  {portfolios.length > 1 && (
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "sm"} 
                      onClick={() => setIsTransferDialogOpen(true)}
                      className="flex-1 sm:flex-initial"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M18 8L22 12L18 16" />
                        <path d="M2 12H22" />
                      </svg>
                      Trasferisci Asset
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-4">
                {assets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Non hai ancora nessun asset in questo portfolio</p>
                    <Button variant="outline" onClick={() => setIsAddAssetDialogOpen(true)}>Aggiungi il primo asset</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {assets.slice(0, 6).map(asset => (
                      <div 
                        key={asset.id} 
                        className="border rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:bg-muted/20 transition-colors cursor-pointer shadow-sm" 
                        onClick={() => handleOpenTransferDialog(asset.id)}
                      >
                        {asset.imageUrl ? (
                          <img 
                            src={asset.imageUrl} 
                            alt={asset.name} 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 object-cover" 
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-medium text-sm">
                              {asset.symbol.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-sm sm:text-base">{asset.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:justify-between mt-0.5 sm:mt-1">
                            <span className="text-xs sm:text-sm text-muted-foreground">{asset.balance} {asset.symbol.toUpperCase()}</span>
                            <span className="font-medium text-xs sm:text-sm">{formatCurrency(asset.value || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {assets.length > 6 && (
                      <div 
                        className="border rounded-lg p-3 sm:p-4 flex items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer shadow-sm" 
                        onClick={() => navigate("/assets")}
                      >
                        <span className="text-muted-foreground flex items-center gap-2">
                          <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-medium">+</span>
                          </span>
                          <span className="text-sm sm:text-base">
                            {assets.length - 6} altri asset
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      <AddPortfolioDialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen} />
      
      <AddAssetDialog 
        open={isAddAssetDialogOpen} 
        onOpenChange={setIsAddAssetDialogOpen} 
      />
      
      <TransferAssetDialog 
        open={isTransferDialogOpen} 
        onOpenChange={setIsTransferDialogOpen} 
        initialAssetId={selectedAssetId || undefined}
      />

      <DeletePortfolioDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        portfolio={selectedPortfolio}
      />
    </div>
  );
};

export default Dashboard;
