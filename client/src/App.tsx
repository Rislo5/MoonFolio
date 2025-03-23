import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/contexts/portfolio-context";
import { ThemeProvider } from "@/hooks/use-theme";

import Dashboard from "@/pages/dashboard";
import Portfolios from "@/pages/portfolios";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PortfolioProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col sm:flex-row">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 sm:ml-20 pt-4 sm:pt-6 pb-12 overflow-x-hidden">
              <div className="max-w-7xl mx-auto w-full">
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/portfolios" component={Portfolios} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </main>
          </div>
          <Toaster />
        </PortfolioProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
