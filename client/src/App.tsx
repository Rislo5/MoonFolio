import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import Transactions from "@/pages/transactions";
import Settings from "@/pages/settings";
import Welcome from "@/pages/welcome";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/context/wallet-context";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  const [location] = useLocation();
  const walletConnected = location !== "/" && location !== "/welcome";

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-light-darker dark:bg-dark-DEFAULT text-foreground">
      {walletConnected && <Sidebar />}
      
      <main className="flex-grow sm:p-6 p-4 overflow-x-hidden">
        <Switch>
          <Route path="/" component={Welcome} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="moonfolio-theme">
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
