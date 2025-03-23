import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/contexts/portfolio-context";
import { ThemeProvider } from "@/hooks/use-theme";

import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import Transactions from "@/pages/transactions";
import Portfolios from "@/pages/portfolios";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/navbar";

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PortfolioProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <Navbar />
            <main className="container mx-auto px-4 pt-20 pb-12">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/portfolios" component={Portfolios} />
                <Route path="/assets" component={Assets} />
                <Route path="/transactions" component={Transactions} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
          <Toaster />
        </PortfolioProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
