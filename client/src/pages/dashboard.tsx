import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { fetchPortfolios } from "@/lib/api";
import { Portfolio } from "@shared/schema";
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
import { Skeleton } from "@/components/ui/skeleton";

// Format timestamp to readable date
const formatTimestamp = (timestamp: string | Date | null) => {
  if (!timestamp) return "Unknown";
  return formatDate(new Date(timestamp));
};

const Dashboard = () => {
  const { portfolios, isConnected, setActivePortfolio } = usePortfolio();
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [overviews, setOverviews] = useState<Record<number, { totalValue: number, assetCount: number }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
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
                      {portfolios.find(p => p.isActive)?.name || "Nessuno"}
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
            portfolios.map((portfolio) => (
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
      
      <AddPortfolioDialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen} />
    </div>
  );
};

export default Dashboard;
