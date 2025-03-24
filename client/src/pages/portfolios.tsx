import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import WelcomeScreen from "@/components/welcome-screen";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  BookCopy, 
  PlusCircle, 
  CoinsIcon,
  MoreVertical, 
  Trash, 
  PlusSquare, 
  LogOut,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddPortfolioDialog } from "../components/portfolio/add-portfolio-dialog";
import AddAssetDialog from "../components/portfolio/add-asset-dialog";
import PortfolioOverviewSummary from "../components/portfolio/portfolio-overview-summary";
import { TransferAssetDialog } from "../components/portfolio/transfer-asset-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define type with runtime properties
type ExtendedPortfolio = {
  id: number;
  name: string;
  userId: number | null;
  walletAddress: string | null;
  isEns: boolean | null;
  ensName: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  // Runtime properties added by API
  totalValue?: number;
  assetCount?: number;
};

const Portfolios = () => {
  const { 
    portfolios, 
    activePortfolio, 
    setActivePortfolio, 
    isLoading, 
    deletePortfolio, 
    disconnect 
  } = usePortfolio();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [portfoliosWithData, setPortfoliosWithData] = useState<ExtendedPortfolio[]>([]);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true);
  const [_, navigate] = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [portfolioToAction, setPortfolioToAction] = useState<ExtendedPortfolio | null>(null);
  
  // Funzione per caricare i dati di overview dei portfolio
  const loadPortfolioData = async () => {
    if (portfolios.length === 0) return;
    
    setIsLoadingPortfolios(true);
    try {
      const updatedPortfolios = await Promise.all(
        portfolios.map(async (portfolio) => {
          try {
            const response = await fetch(`/api/portfolios/${portfolio.id}/overview`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const overview = await response.json();
            const assetsResponse = await fetch(`/api/portfolios/${portfolio.id}/assets`);
            let assetCount = 0;
            
            if (assetsResponse.ok) {
              const assets = await assetsResponse.json();
              assetCount = assets.length;
            }
            
            return {
              ...portfolio,
              totalValue: overview.totalValue || 0,
              assetCount: assetCount || 0
            } as ExtendedPortfolio;
          } catch (error) {
            console.error(`Errore nel caricamento dei dati per il portfolio ${portfolio.id}:`, error);
            return {
              ...portfolio,
              totalValue: 0,
              assetCount: 0
            } as ExtendedPortfolio;
          }
        })
      );
      
      setPortfoliosWithData(updatedPortfolios);
    } catch (error) {
      console.error("Errore nel caricamento dei dati dei portfolio:", error);
    } finally {
      setIsLoadingPortfolios(false);
    }
  };
  
  // Carica i dati quando cambiano i portfolio
  useEffect(() => {
    if (portfolios.length > 0) {
      loadPortfolioData();
    }
  }, [portfolios]);
  
  // If no portfolios exist, show welcome screen
  if (portfolios.length === 0) {
    return <WelcomeScreen />;
  }

  const manualPortfolios = portfoliosWithData.filter(p => !p.isEns);
  const ensPortfolios = portfoliosWithData.filter(p => p.isEns);

  // Calculate total value across all portfolios
  const totalPortfolioValue = portfoliosWithData.reduce((sum, portfolio) => {
    return sum + (portfolio.totalValue || 0);
  }, 0);

  // Funzione per visualizzare i dettagli del portfolio
  const handleViewPortfolio = (e: React.MouseEvent, portfolioId: number) => {
    e.stopPropagation();
    setActivePortfolio(portfolioId);
    // Se siamo già alla pagina del dettaglio del portfolio corretto, non fare nulla
    navigate(`/portfolios/${portfolioId}`);
  };
  
  const handleAddAsset = (portfolioId?: number) => {
    if (portfolioId) {
      setActivePortfolio(portfolioId);
      setIsAddAssetDialogOpen(true);
    } else if (activePortfolio) {
      setIsAddAssetDialogOpen(true);
    } else {
      toast({
        title: "Nessun portfolio attivo",
        description: "Seleziona prima un portfolio per aggiungere asset",
        variant: "destructive",
      });
    }
  };
  
  // Gestisce il click sul menu a tre puntini per evitare propagazione al card
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Apre il dialogo di conferma per l'eliminazione
  const handleDeleteClick = (e: React.MouseEvent, portfolio: ExtendedPortfolio) => {
    e.stopPropagation();
    setPortfolioToAction(portfolio);
    setShowDeleteDialog(true);
  };
  
  // Apre il dialogo di conferma per la disconnessione
  const handleDisconnectClick = (e: React.MouseEvent, portfolio: ExtendedPortfolio) => {
    e.stopPropagation();
    setPortfolioToAction(portfolio);
    setShowDisconnectDialog(true);
  };
  
  // Elimina effettivamente il portfolio
  const confirmDelete = async () => {
    if (!portfolioToAction) return;
    
    try {
      await deletePortfolio(portfolioToAction.id);
      toast({
        title: "Portfolio eliminato",
        description: `Il portfolio "${portfolioToAction.name}" è stato eliminato con successo.`
      });
    } catch (error) {
      console.error("Errore durante l'eliminazione del portfolio:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del portfolio.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setPortfolioToAction(null);
    }
  };
  
  // Disconnette effettivamente il wallet ENS
  const confirmDisconnect = async () => {
    if (!portfolioToAction) return;
    
    try {
      await disconnect();
      toast({
        title: "Wallet disconnesso",
        description: `Il wallet "${portfolioToAction.name}" è stato disconnesso con successo.`
      });
    } catch (error) {
      console.error("Errore durante la disconnessione del wallet:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la disconnessione del wallet.",
        variant: "destructive"
      });
    } finally {
      setShowDisconnectDialog(false);
      setPortfolioToAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">I tuoi Portfolio</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i tuoi portfolio di criptovalute
          </p>
        </div>
        <div className="flex space-x-2">
          {activePortfolio && (
            <>
              <Button onClick={handleAddAsset} variant="outline">
                <CoinsIcon className="mr-2 h-4 w-4" />
                Aggiungi Asset
              </Button>
              
              {portfolios.length > 1 && (
                <Button 
                  variant="outline"
                  onClick={() => setIsTransferDialogOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M18 8L22 12L18 16" />
                    <path d="M2 12H22" />
                  </svg>
                  Trasferisci Asset
                </Button>
              )}
            </>
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuovo Portfolio
          </Button>
        </div>
      </div>
      
      {/* Riepilogo dettagliato */}
      <PortfolioOverviewSummary />
      
      {manualPortfolios.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wallet className="mr-2 h-5 w-5" /> 
            Portfolio Manuali
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manualPortfolios.map(portfolio => {
              const extendedPortfolio = portfolio as ExtendedPortfolio;
              return (
                <Card 
                  key={portfolio.id} 
                  className={`hover:shadow-md transition-all cursor-pointer ${
                    activePortfolio?.id === portfolio.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setActivePortfolio(portfolio.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{portfolio.name}</CardTitle>
                        <CardDescription>
                          Creato il {portfolio.createdAt 
                            ? new Date(portfolio.createdAt).toLocaleDateString() 
                            : 'data non disponibile'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activePortfolio?.id === portfolio.id && (
                          <Badge variant="default">Attivo</Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                handleMenuClick(e);
                                handleAddAsset(portfolio.id);
                              }}
                            >
                              <PlusSquare className="mr-2 h-4 w-4" />
                              <span>Aggiungi Asset</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteClick(e, portfolio)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Elimina Portfolio</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPortfolios ? (
                      <>
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-4 w-16" />
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">
                          {formatCurrency(extendedPortfolio.totalValue || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {extendedPortfolio.assetCount || 0} asset
                        </p>
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={(e) => handleViewPortfolio(e, portfolio.id)}
                    >
                      Visualizza Dettagli
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {ensPortfolios.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookCopy className="mr-2 h-5 w-5" /> 
            Wallet ENS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ensPortfolios.map(portfolio => {
              const extendedPortfolio = portfolio as ExtendedPortfolio;
              return (
                <Card 
                  key={portfolio.id} 
                  className={`hover:shadow-md transition-all cursor-pointer ${
                    activePortfolio?.id === portfolio.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setActivePortfolio(portfolio.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{portfolio.name}</CardTitle>
                        <CardDescription>
                          {portfolio.ensName || portfolio.walletAddress?.substring(0, 10) + '...'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activePortfolio?.id === portfolio.id && (
                          <Badge variant="default">Attivo</Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => handleDisconnectClick(e, portfolio)}
                              className="text-red-600"
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              <span>Disconnetti Wallet</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPortfolios ? (
                      <>
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-4 w-16" />
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">
                          {formatCurrency(extendedPortfolio.totalValue || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {extendedPortfolio.assetCount || 0} asset
                        </p>
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={(e) => handleViewPortfolio(e, portfolio.id)}
                    >
                      Visualizza Dettagli
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      <AddPortfolioDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      
      <AddAssetDialog 
        open={isAddAssetDialogOpen}
        onOpenChange={setIsAddAssetDialogOpen}
      />
      
      <TransferAssetDialog 
        open={isTransferDialogOpen} 
        onOpenChange={setIsTransferDialogOpen} 
        initialAssetId={selectedAssetId || undefined}
      />
      
      {/* Dialogo di conferma per eliminare il portfolio */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questo portfolio?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà permanentemente il portfolio "{portfolioToAction?.name}" 
              e tutti i suoi asset e transazioni. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash className="h-4 w-4 mr-2" />
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialogo di conferma per disconnettere il wallet ENS */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnettere questo wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per disconnettere il wallet "{portfolioToAction?.name}". 
              Potrai riconnetterlo in qualsiasi momento. I tuoi dati verranno rimossi dalla dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnect}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnetti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Portfolios;