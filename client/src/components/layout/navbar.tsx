import { Link, useLocation } from "wouter";
import { RocketIcon, Moon, Sun, Wallet, LayoutDashboard, CoinsIcon, HistoryIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useState } from "react";
import { 
  Sheet,
  SheetContent,
  SheetTrigger 
} from "@/components/ui/sheet";

const Navbar = () => {
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { portfolios, isConnected, disconnect, activePortfolio } = usePortfolio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Se siamo già connessi ma vogliamo tornare alla pagina di benvenuto
    // non disconnettiamo il portfolio, ma andiamo semplicemente alla home
    setLocation("/");
    
    // Chiudi il menu mobile se è aperto
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };
  
  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<any> }) => (
    <li>
      <div 
        className={`flex items-center py-2 pr-4 pl-3 rounded md:p-2 transition-colors cursor-pointer ${
          location === href 
            ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-medium" 
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
        }`}
        onClick={() => setLocation(href)}
      >
        <Icon className="h-4 w-4 mr-2" />
        <span>{label}</span>
      </div>
    </li>
  );
  
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 fixed w-full z-20 top-0 left-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
      <div className="container flex flex-wrap justify-between items-center mx-auto">
        <button onClick={handleLogoClick} className="flex items-center">
          <RocketIcon className="h-7 w-7 text-primary-600 dark:text-primary-400 mr-2" />
          <span className="self-center text-xl font-bold whitespace-nowrap text-gray-900 dark:text-white">
            Moonfolio
          </span>
          {activePortfolio && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium truncate max-w-[120px]">
              {activePortfolio.name}
            </span>
          )}
        </button>
        
        <div className="flex items-center md:order-2 space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {isConnected && (
            <Button variant="destructive" size="sm" onClick={disconnect} className="hidden md:flex">
              Disconnetti
            </Button>
          )}
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full">
                <div className="py-6">
                  <h2 className="text-lg font-semibold mb-6">Menu</h2>
                  <ul className="space-y-2">
                    <NavLink href="/" label="Dashboard" icon={LayoutDashboard} />
                    <NavLink href="/portfolios" label="Portfolio" icon={Wallet} />
                    <NavLink href="/assets" label="Asset" icon={CoinsIcon} />
                    <NavLink href="/transactions" label="Transazioni" icon={HistoryIcon} />
                  </ul>
                </div>
                
                <div className="mt-auto pb-6">
                  {isConnected && (
                    <Button variant="destructive" onClick={disconnect} className="w-full">
                      Disconnetti
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="hidden justify-between items-center w-full md:flex md:w-auto md:order-1">
          <ul className="flex flex-row space-x-1 py-1 px-1 mt-0 text-sm font-medium bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <NavLink href="/" label="Dashboard" icon={LayoutDashboard} />
            <NavLink href="/portfolios" label="Portfolio" icon={Wallet} />
            <NavLink href="/assets" label="Asset" icon={CoinsIcon} />
            <NavLink href="/transactions" label="Transazioni" icon={HistoryIcon} />
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
