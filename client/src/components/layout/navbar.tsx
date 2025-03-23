import { Link, useLocation } from "wouter";
import { RocketIcon, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { usePortfolio } from "@/hooks/use-portfolio";

const Navbar = () => {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, disconnect } = usePortfolio();
  
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 fixed w-full z-20 top-0 left-0">
      <div className="container flex flex-wrap justify-between items-center mx-auto">
        <Link href="/">
          <a className="flex items-center">
            <RocketIcon className="h-6 w-6 text-primary-DEFAULT dark:text-primary-light mr-2" />
            <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
              Moonfolio
            </span>
          </a>
        </Link>
        
        <div className="flex items-center md:order-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="p-2 mr-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {isConnected && (
            <Button variant="destructive" onClick={disconnect}>
              Disconnect
            </Button>
          )}
        </div>
        
        {isConnected && (
          <div className="hidden justify-between items-center w-full md:flex md:w-auto md:order-1">
            <ul className="flex flex-col p-4 mt-4 bg-gray-50 rounded-lg border border-gray-100 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-800 dark:border-gray-700">
              <li>
                <Link href="/">
                  <a className={`py-2 pr-4 pl-3 rounded md:p-0 ${
                    location === "/" 
                      ? "text-primary-DEFAULT dark:text-primary-light" 
                      : "text-gray-700 dark:text-gray-200"
                  }`}>
                    Dashboard
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/assets">
                  <a className={`py-2 pr-4 pl-3 rounded md:p-0 ${
                    location === "/assets" 
                      ? "text-primary-DEFAULT dark:text-primary-light" 
                      : "text-gray-700 dark:text-gray-200"
                  }`}>
                    Assets
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/transactions">
                  <a className={`py-2 pr-4 pl-3 rounded md:p-0 ${
                    location === "/transactions" 
                      ? "text-primary-DEFAULT dark:text-primary-light" 
                      : "text-gray-700 dark:text-gray-200"
                  }`}>
                    Transactions
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
