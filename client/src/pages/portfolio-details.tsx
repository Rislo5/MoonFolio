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
import PortfolioCharts from "@/components/portfolio/portfolio-charts";
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
      // Imposta il portfolio attivo se non lo è già
      if (!activePortfolio || activePortfolio.id !== portfolioId) {
        setActivePortfolio(portfolioId);
      }
    } else {
      // Se non c'è un match con la rotta, torniamo alla dashboard
      navigate("/");
    }
  }, [match, params, activePortfolio, setActivePortfolio, navigate]);
  
  // Funzione per aprire il dialogo di trasferimento
  const handleOpenTransferDialog = (assetId: number) => {
    setSelectedAssetId(assetId);
    setIsTransferDialogOpen(true);
  };

  // Se non c'è un portfolio attivo o se siamo in attesa del caricamento
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
            Gestisci e analizza il tuo portfolio
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={() => setIsAddAssetDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
            Aggiungi Asset
          </Button>
          {portfolios.length > 1 && (
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={() => setIsTransferDialogOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2">
                <path d="M18 8L22 12L18 16" />
                <path d="M2 12H22" />
              </svg>
              Trasferisci
            </Button>
          )}
        </div>
      </div>
      
      {/* Riepilogo portfolio */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-xl">Riepilogo Portfolio</CardTitle>
          <CardDescription>
            Panoramica del valore e delle performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Valore Totale</h3>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(portfolioOverview?.totalValue || 0)}
              </p>
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Cambio 24h</h3>
              <div className="flex items-center">
                <p className={`text-xl sm:text-2xl font-bold ${
                  (portfolioOverview?.change24hPercentage || 0) >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {formatCurrency(portfolioOverview?.change24h || 0)}
                </p>
                <span className={`text-sm ml-2 ${
                  (portfolioOverview?.change24hPercentage || 0) >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {(portfolioOverview?.change24hPercentage || 0) >= 0 ? '+' : ''}
                  {(portfolioOverview?.change24hPercentage || 0).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-background rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Numero di Asset</h3>
              <p className="text-xl sm:text-2xl font-bold">{assets.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sezione Grafici */}
      {assets.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Analisi Portfolio
            </h2>
          </div>
          
          <PortfolioCharts />
        </div>
      )}
      
      {/* Sezione Dettagli */}
      <div>
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
            {assets.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Nessun asset presente</h3>
                <p className="text-muted-foreground mb-6">
                  Aggiungi il tuo primo asset per iniziare a tracciare il tuo portfolio
                </p>
                <Button onClick={() => setIsAddAssetDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Aggiungi Asset
                </Button>
              </div>
            ) : (
              <AssetDetailTable />
            )}
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