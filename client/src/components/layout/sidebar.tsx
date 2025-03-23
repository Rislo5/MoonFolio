import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, X, LayoutDashboard, Wallet, Settings } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
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
          <Icon className="mr-2 h-5 w-5" />
          <span>{label}</span>
        </Button>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-bold text-xl text-primary">Moonfolio</div>
        </div>
        <ModeToggle />
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
          "flex-shrink-0 w-full sm:w-20 lg:w-64 h-screen fixed sm:sticky top-0 left-0 z-50",
          "transform transition-transform duration-200 ease-in-out",
          "bg-background border-r",
          "sm:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
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
            <h1 className="font-bold text-xl hidden lg:block">Moonfolio</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-2">
          <NavItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            current={location === "/dashboard"}
          />
          <NavItem
            href="/portfolios"
            icon={Wallet}
            label="Portfolio"
            current={location === "/portfolios" || location.startsWith("/portfolio/")}
          />
          <NavItem
            href="/settings"
            icon={Settings}
            label="Settings"
            current={location === "/settings"}
          />

          <Separator className="my-4" />

          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground hidden lg:inline-block">Theme</span>
              <ModeToggle />
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
