import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, LayoutDashboard, Wallet, ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Keep sidebar expanded on large screens by default
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const NavItem = ({ href, icon: Icon, label, current }: { href: string; icon: any; label: string; current: boolean }) => {
    return (
      <Link href={href}>
        <Button
          variant={current ? "default" : "ghost"}
          className={cn(
            "w-full justify-start",
            current
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-muted"
          )}
          onClick={() => setIsMobileOpen(false)}
        >
          <Icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
          {!isCollapsed && (
            <span>{label}</span>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="sm:hidden flex items-center justify-between sticky top-0 z-50 p-4 bg-background border-b shadow-sm">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-3">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-bold text-xl text-primary">Moonfolio</div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex-shrink-0 h-[100dvh] sm:h-screen fixed sm:sticky top-0 left-0 z-50",
          "transform transition-all duration-200 ease-in-out",
          "bg-background border-r shadow-sm",
          "sm:translate-x-0 overflow-y-auto hide-scrollbar",
          isMobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
          isCollapsed 
            ? "w-[85vw] sm:w-20" 
            : "w-[85vw] sm:w-20 lg:w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 h-16">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
              <path d="M12 3v9l5-5" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <h1 className={cn("font-bold text-xl", 
              isCollapsed ? "hidden" : "hidden lg:block"
            )}>
              Moonfolio
            </h1>
          </div>
          <div className="flex">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="hidden sm:flex"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-2">
          <Link href="/">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                location === "/"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <LayoutDashboard className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
              {!isCollapsed && (
                <span>Dashboard</span>
              )}
            </Button>
          </Link>
          <Link href="/portfolios">
            <Button
              variant={location === "/portfolios" || location.startsWith("/portfolios/") ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                location === "/portfolios" || location.startsWith("/portfolios/")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <Wallet className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
              {!isCollapsed && (
                <span>Portfolio</span>
              )}
            </Button>
          </Link>

          <Separator className="my-4" />

          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <span className={cn("text-sm text-muted-foreground", 
                isCollapsed ? "hidden" : "hidden lg:inline-block"
              )}>
                Theme
              </span>
              <ModeToggle />
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
