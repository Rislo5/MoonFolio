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
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-muted">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                </svg>
                Riepilogo Portfolio
              </h2>
              <p className="text-sm text-muted-foreground">
                Visione aggregata di tutti i tuoi investimenti
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-background/80 border rounded-lg shadow-sm">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v10l4.24 4.24"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  Ultimo aggiornamento
                </span>
                <span className="text-xs font-medium">
                  {isLoading ? <Skeleton className="h-3 w-20" /> : formatTimestamp(new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Valore Totale */}
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-border/50 flex flex-col transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 2v20"></path>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Valore Totale
                </h3>
                <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                  Portafoglio
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-36 mb-3" />
              ) : (
                <div className="mb-3">
                  <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">in {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'}</p>
                </div>
              )}
              <div className="mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs font-medium text-green-500">+0.00%</span>
                  <span className="text-xs text-muted-foreground">ultime 24h</span>
                </div>
              </div>
            </div>
            
            {/* Card 2: Portfolio Attivo */}
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-border/50 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                  Portfolio Attivo
                </h3>
                <div className="bg-green-500/10 text-green-500 text-xs font-medium px-2 py-1 rounded-full">
                  Attivo
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-40 mb-3" />
              ) : (
                <div className="mb-3">
                  <p className="text-xl sm:text-2xl font-bold truncate flex items-center">
                    {isConnected ? (
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                        <span className="truncate">{(portfolios as ExtendedPortfolio[]).find(p => p.isActive)?.name || "Nessuno"}</span>
                      </span>
                    ) : (
                      "Nessuno"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isConnected ? 'Portfolio selezionato' : 'Nessun portfolio selezionato'}
                  </p>
                </div>
              )}
              <div className="mt-auto">
                {isConnected && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs" 
                    onClick={() => navigate("/portfolios")}
                  >
                    Visualizza Dettagli
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Card 3: Distribuzione */}
            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-border/50 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M3 22v-8.5l9.126-1.652a1.137 1.137 0 0 0 .874-1.125v-3.068a1.137 1.137 0 0 0-.628-1.022l-1.733-.925a3.4 3.4 0 0 1-1.239-1.33 3.4 3.4 0 0 1-.4-1.628V2"></path>
                    <path d="M19.364 11.241a39.05 39.05 0 0 0-2.4-2.4.984.984 0 0 0-1.682.629v3.879a.949.949 0 0 0 .599.913c.204.08.42.112.636.096a.94.94 0 0 0 .649-.282c.189-.21.363-.437.519-.679.155-.247.292-.508.4-.775.109-.281.177-.578.2-.888a.998.998 0 0 0-.92-.493Z"></path>
                    <path d="M18.074 15.399a10.442 10.442 0 0 0-2.342-1.911 2.132 2.132 0 0 0-2.74.396 2.153 2.153 0 0 0-.228 2.42 5.695 5.695 0 0 0 2.728 2.6"></path>
                    <path d="M9 12h.01"></path>
                  </svg>
                  Distribuzione
                </h3>
                <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                  Asset
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-28 mb-3" />
              ) : (
                <div className="mb-3">
                  <p className="text-xl sm:text-2xl font-bold">
                    {assets?.length || 0} <span className="text-base sm:text-lg font-normal text-muted-foreground">asset</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    in {portfolios.length} {portfolios.length === 1 ? 'portfolio' : 'portfolios'}
                  </p>
                </div>
              )}
              <div className="mt-auto">
                {assets && assets.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {assets.slice(0, 3).map((asset, i) => (
                      <div 
                        key={asset.id}
                        className="w-6 h-6 rounded-full overflow-hidden border border-background flex-shrink-0"
                        style={{ marginLeft: i > 0 ? '-6px' : '0' }}
                      >
                        {asset.imageUrl ? (
                          <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                            <span className="text-xs text-primary font-medium">
                              {asset.symbol.substring(0, 1).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {assets.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border border-background" style={{ marginLeft: '-6px' }}>
                        +{assets.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Nessun asset aggiunto
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
              <div 
                key={portfolio.id} 
                className="group relative rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card"
                onClick={() => handlePortfolioSelect(portfolio)}
              >
                {/* Gradiente decorativo superiore */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/50 to-primary"></div>
                
                {/* Indicatore attivo */}
                {portfolio.isActive && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs py-1 px-2 rounded-full whitespace-nowrap backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                      <span>Attivo</span>
                    </div>
                  </div>
                )}
                
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-medium mb-1 truncate pr-20">{portfolio.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      Creato il {formatTimestamp(portfolio.createdAt)}
                    </p>
                  </div>
                  
                  {/* Valore */}
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-xs text-muted-foreground">Valore Totale</p>
                      <div className="flex items-center gap-1 text-green-500 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                          <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span>+0.0%</span>
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {formatCurrency(overviews[portfolio.id]?.totalValue || 0)}
                    </p>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Asset</p>
                      <p className="text-sm sm:text-base font-medium">
                        {overviews[portfolio.id]?.assetCount || 0}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Transazioni</p>
                      <p className="text-sm sm:text-base font-medium">
                        0
                      </p>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t pt-3 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    >
                      Visualizza Dettagli
                      <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Add portfolio card */}
          <div 
            className="group relative rounded-xl border-dashed border-2 border-muted overflow-hidden bg-muted/10 hover:bg-muted/20 hover:border-primary/20 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer h-full"
            onClick={() => setIsAddPortfolioOpen(true)}
          >
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center">
              <div className="relative mb-4 group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30 group-hover:opacity-70"></div>
                <Button
                  variant="outline"
                  className="relative rounded-full h-12 w-12 sm:h-14 sm:w-14 p-0 border-primary/30 bg-background shadow-sm group-hover:border-primary group-hover:shadow-md"
                >
                  <PlusCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </Button>
              </div>
              <p className="text-center font-medium text-sm sm:text-base">
                Aggiungi un nuovo portfolio
              </p>
              <p className="text-center text-muted-foreground text-xs mt-1">
                Tieni traccia dei tuoi investimenti
              </p>
            </div>
          </div>
        </div>
      </div>
      
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
            <div className="rounded-xl overflow-hidden border shadow-sm bg-card">
              <div className="relative bg-muted/30">
                {/* Gradiente superiore */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/20 to-transparent"></div>
                
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center">
                  <div>
                    <h3 className="font-medium text-base truncate flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
                        <path d="M19.9 17.5C20 16.7 20 15.9 20 15v-2c0-1.7-.9-3.1-2-3.8"></path>
                        <path d="M16 8.8c-.3-.3-.6-.5-1-.6"></path>
                        <path d="M6.2 13.2c-.5.9-.8 1.8-.8 2.8v2c0 3 2.5 5 6.5 5 .7 0 1.4-.1 2-.2"></path>
                        <path d="m20 7 2 2h-4l-2-2"></path>
                        <path d="m14 3-2 2h4l2-2"></path>
                        <path d="M3 3v6"></path>
                        <path d="M3 6h6"></path>
                        <path d="m10 16-2 3 5 5 3-3-6-5Z"></path>
                      </svg>
                      Asset nel Portfolio {(portfolios as ExtendedPortfolio[]).find(p => p.isActive)?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gestisci i tuoi asset in questo portfolio
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size={isMobile ? "sm" : "sm"} 
                      onClick={() => setIsAddAssetDialogOpen(true)}
                      className="flex-1 sm:flex-initial bg-card hover:bg-primary/5"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Aggiungi Asset
                    </Button>
                    {portfolios.length > 1 && (
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "sm"} 
                        onClick={() => setIsTransferDialogOpen(true)}
                        className="flex-1 sm:flex-initial bg-card hover:bg-primary/5"
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
              </div>
              <div className="p-4 sm:p-5">
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
                        className="group relative border rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-muted/10 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20" 
                        onClick={() => handleOpenTransferDialog(asset.id)}
                      >
                        {/* Leggero indicatore pulsante sul lato sinistro */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-0 bg-primary rounded-r opacity-0 group-hover:h-1/2 group-hover:opacity-100 transition-all duration-300"></div>
                        
                        {/* Icona dell'asset */}
                        <div className="relative">
                          {asset.imageUrl ? (
                            <img 
                              src={asset.imageUrl} 
                              alt={asset.name} 
                              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex-shrink-0 object-cover shadow-sm group-hover:shadow-md transition-all duration-300" 
                            />
                          ) : (
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:bg-primary/15 transition-all duration-300">
                              <span className="text-primary font-medium text-sm">
                                {asset.symbol.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          {/* Badge per il simbolo */}
                          <div className="absolute -bottom-1 -right-1 bg-muted text-xs font-medium py-0.5 px-1.5 rounded-md border shadow-sm">
                            {asset.symbol.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium truncate text-sm sm:text-base pr-2">{asset.name}</h4>
                            <div className="flex items-center text-green-500 text-xs">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                <polyline points="16 7 22 7 22 13"></polyline>
                              </svg>
                              <span className="ml-0.5">0.0%</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-1.5">
                            <div>
                              <p className="text-xs text-muted-foreground">Quantità</p>
                              <p className="text-xs sm:text-sm font-medium">{asset.balance}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Valore</p>
                              <p className="text-xs sm:text-sm font-medium">{formatCurrency(asset.value || 0)}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Freccia/indicatore sulla destra visibile solo su hover */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Card "Mostra altro" */}
                    {assets.length > 6 && (
                      <div 
                        className="group relative border rounded-lg p-4 flex items-center justify-center gap-3 bg-muted/5 hover:bg-muted/15 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20" 
                        onClick={() => navigate("/assets")}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 mb-2 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                              <path d="M21 10H3"></path>
                              <path d="M21 6H3"></path>
                              <path d="M21 14H3"></path>
                              <path d="M21 18H3"></path>
                            </svg>
                          </div>
                          <p className="font-medium text-sm">Visualizza tutti gli asset</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Altri {assets.length - 6} asset disponibili
                          </p>
                        </div>
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
