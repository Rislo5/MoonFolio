import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, LayoutDashboard, Wallet, ChevronLeft, ChevronRight, HelpCircle, Info } from "lucide-react";
import { MoonfolioMoonIcon, MoonfolioTextIcon } from "@/assets/logo";
import { FaqDialog } from "@/components/faq";
import { AboutUsDialog } from "@/components/about-us";

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  
  // State for dialogs
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);

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
  
  // Button for dialogs (FAQ and About Us)
  const DialogButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start hover:bg-muted"
        onClick={onClick}
      >
        <Icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
        {!isCollapsed && (
          <span>{label}</span>
        )}
      </Button>
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
          <div className="font-bold text-xl text-primary flex items-center">
            <MoonfolioMoonIcon className="h-6 w-6 text-primary mr-2" />
            Moonfolio
          </div>
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
            {/* Logo display logic: Moon icon when collapsed, full logo when expanded */}
            {isCollapsed ? (
              <MoonfolioMoonIcon className="h-8 w-8 text-primary" />
            ) : (
              <div className="flex items-center">
                <MoonfolioMoonIcon className="h-7 w-7 text-primary" />
                <h1 className="font-bold text-xl hidden lg:block ml-2">
                  Moonfolio
                </h1>
              </div>
            )}
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
        <nav className="flex flex-col h-full p-2">
          <div className="space-y-2">
            <NavItem
              href="/"
              icon={LayoutDashboard}
              label="Dashboard"
              current={location === "/" || location === "/dashboard"}
            />
            <NavItem
              href="/portfolios"
              icon={Wallet}
              label="Portfolios"
              current={location === "/portfolios" || location.startsWith("/portfolios/")}
            />
          </div>

          {/* Flex spacer to push controls to the bottom */}
          <div className="flex-grow"></div>
          
          <div className="space-y-2 mt-auto pt-4">
            <Separator className="mb-4" />
            
            {/* Help & Info section */}
            <div className="space-y-1 mb-4">
              <DialogButton 
                icon={HelpCircle} 
                label="FAQ" 
                onClick={() => setIsFaqOpen(true)}
              />
              <DialogButton 
                icon={Info} 
                label="About Us" 
                onClick={() => setIsAboutUsOpen(true)}
              />
            </div>
            
            <Separator className="mb-4" />
            
            {/* Theme Toggle */}
            <div className={cn(
              "flex items-center px-3 py-2 rounded-md",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              {!isCollapsed && (
                <span className="text-sm text-muted-foreground hidden lg:inline-block">
                  Theme
                </span>
              )}
              <ModeToggle />
            </div>
          </div>
        </nav>
      </aside>
      
      {/* Modals/Dialogs */}
      <FaqDialog open={isFaqOpen} onOpenChange={setIsFaqOpen} />
      <AboutUsDialog open={isAboutUsOpen} onOpenChange={setIsAboutUsOpen} />
    </>
  );
}
