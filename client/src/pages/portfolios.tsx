import { useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import WelcomeScreen from "@/components/welcome-screen";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, BookCopy, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";

const Portfolios = () => {
  const { portfolios, activePortfolio, setActivePortfolio, isLoading } = usePortfolio();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // If no portfolios exist, show welcome screen
  if (portfolios.length === 0) {
    return <WelcomeScreen />;
  }
  
  const manualPortfolios = portfolios.filter(p => !p.isEns);
  const ensPortfolios = portfolios.filter(p => p.isEns);
  
  // Calculate total value across all portfolios
  const totalPortfolioValue = portfolios.reduce((sum, portfolio) => {
    // This is a placeholder, in a real app we would fetch the portfolio value
    return sum + (portfolio.totalValue || 0);
  }, 0);
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">I tuoi Portfolio</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i tuoi portfolio di criptovalute
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuovo Portfolio
        </Button>
      </div>
      
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Riepilogo Generale</CardTitle>
          <CardDescription>Panoramica di tutti i tuoi portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Valore Totale</div>
              <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
            </div>
            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Numero di Portfolio</div>
              <div className="text-2xl font-bold">{portfolios.length}</div>
            </div>
            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">Portfolio Attivo</div>
              <div className="text-xl font-bold truncate">{activePortfolio?.name || "Nessuno"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {manualPortfolios.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wallet className="mr-2 h-5 w-5" /> 
            Portfolio Manuali
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manualPortfolios.map(portfolio => (
              <Card 
                key={portfolio.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${
                  activePortfolio?.id === portfolio.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setActivePortfolio(portfolio.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{portfolio.name}</CardTitle>
                    {activePortfolio?.id === portfolio.id && (
                      <Badge variant="default" className="ml-2">Attivo</Badge>
                    )}
                  </div>
                  <CardDescription>
                    Creato il {new Date(portfolio.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(portfolio.totalValue || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {portfolio.assetCount || 0} asset
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePortfolio(portfolio.id);
                      window.location.href = '/';
                    }}
                  >
                    Visualizza Dettagli
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
            {ensPortfolios.map(portfolio => (
              <Card 
                key={portfolio.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${
                  activePortfolio?.id === portfolio.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setActivePortfolio(portfolio.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{portfolio.name}</CardTitle>
                    {activePortfolio?.id === portfolio.id && (
                      <Badge variant="default" className="ml-2">Attivo</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {portfolio.ensName || portfolio.walletAddress?.substring(0, 10) + '...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(portfolio.totalValue || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {portfolio.assetCount || 0} asset
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePortfolio(portfolio.id);
                      window.location.href = '/';
                    }}
                  >
                    Visualizza Dettagli
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <AddPortfolioDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default Portfolios;