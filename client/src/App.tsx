import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { PortfolioProvider } from "@/contexts/portfolio-context";
import { ThemeProvider } from "@/hooks/use-theme";

import Dashboard from "@/pages/dashboard";
import Portfolios from "@/pages/portfolios";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import WelcomeScreen from "@/components/welcome-screen";

function App() {
  const [location] = useLocation();
  
  // Controlla se l'utente è su una delle rotte della dashboard, per evitare di mostrare 
  // la sidebar sulla schermata di benvenuto
  const isDashboardRoute = location === "/" || location === "/dashboard" || location === "/portfolios";
  
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PortfolioProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex">
            {isDashboardRoute && <Sidebar />}
            <main className={`flex-1 p-6 ${isDashboardRoute ? "sm:ml-20 lg:ml-64" : ""} pt-6 pb-12`}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/portfolios" component={Portfolios} />
                <Route path="/welcome" component={WelcomeScreen} />
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
