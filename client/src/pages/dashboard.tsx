import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
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
  LineChart
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";
import { TransferAssetDialog } from "@/components/portfolio/transfer-asset-dialog";
import AddAssetDialog from "@/components/portfolio/add-asset-dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Format timestamp to readable date
const formatTimestamp = (timestamp: string | Date | null) => {
  if (!timestamp) return "Unknown";
  return formatDate(new Date(timestamp));
};

const Dashboard = () => {
  const { portfolios, assets, isConnected, setActivePortfolio } = usePortfolio();
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [overviews, setOverviews] = useState<Record<number, { totalValue: number, assetCount: number }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Reindirizza alla welcome screen se non ci sono portfolio
  useEffect(() => {
    if (!isLoading && portfolios.length === 0) {
      navigate('/welcome');
    }
  }, [isLoading, portfolios.length, navigate]);
  
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
  
  // Se non ci sono portfolios, la precedente useEffect si occuperà di reindirizzare
  // alla pagina di benvenuto, quindi non dobbiamo fare altro qui
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Panoramica di tutti i tuoi portfolio di criptovalute
          </p>
        </div>
        <Button onClick={() => setIsAddPortfolioOpen(true)} className="ml-auto gap-1">
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Valore Totale</h3>
              {isLoading ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <p className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
              )}
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Numero di Portfolio</h3>
              {isLoading ? (
                <Skeleton className="h-9 w-8" />
              ) : (
                <p className="text-2xl font-bold">{portfolios.length}</p>
              )}
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Portfolio Attivo</h3>
              {isLoading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <p className="text-2xl font-bold">
                  {isConnected ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      {(portfolios as ExtendedPortfolio[]).find(p => p.isActive)?.name || "Nessuno"}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
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
              <Card key={portfolio.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    {portfolio.name}
                    {portfolio.isActive && (
                      <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full">
                        Attivo
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Creato il {formatTimestamp(portfolio.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-4">
                    {formatCurrency(overviews[portfolio.id]?.totalValue || 0)}
                  </p>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{overviews[portfolio.id]?.assetCount || 0} asset</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <LineChart className="h-4 w-4" />
                      <span>Performance: <span className="text-green-500">+0.0%</span></span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button variant="outline" onClick={() => handlePortfolioSelect(portfolio)}>
                    Visualizza
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
          
          {/* Add portfolio card */}
          <Card className="overflow-hidden border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <Button
                variant="outline"
                className="rounded-full h-12 w-12 p-0 mb-4"
                onClick={() => setIsAddPortfolioOpen(true)}
              >
                <PlusCircle className="h-6 w-6" />
              </Button>
              <p className="text-center text-muted-foreground">
                Aggiungi un nuovo portfolio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Sezione Asset */}
      {assets && assets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Asset nel Portfolio Attivo
            </h2>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="bg-background border rounded-lg overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-medium">Asset nel Portfolio {(portfolios as ExtendedPortfolio[]).find(p => p.isActive)?.name}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAddAssetDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Aggiungi Asset
                  </Button>
                  {portfolios.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => setIsTransferDialogOpen(true)}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {assets.slice(0, 6).map(asset => (
                      <div key={asset.id} className="border rounded-lg p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => handleOpenTransferDialog(asset.id)}>
                        {asset.imageUrl && (
                          <img src={asset.imageUrl} alt={asset.name} className="w-10 h-10 rounded-full" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{asset.name}</h4>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-muted-foreground">{asset.balance} {asset.symbol.toUpperCase()}</span>
                            <span className="font-medium">{formatCurrency(asset.value || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {assets.length > 6 && (
                      <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate("/assets")}>
                        <span className="text-muted-foreground">+{assets.length - 6} altri asset</span>
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
    </div>
  );
};

export default Dashboard;
