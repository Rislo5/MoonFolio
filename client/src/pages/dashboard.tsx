import { useState } from "react";
import { useLocation, Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Portfolio } from "@shared/schema";
import WelcomeScreen from "@/components/welcome-screen";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";

// Extends Portfolio type with isActive property
type ExtendedPortfolio = Portfolio & {
  isActive?: boolean;
};

const Dashboard = () => {
  const { setActivePortfolio } = usePortfolio();
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [_, navigate] = useLocation();
  
  const handlePortfolioSelect = (portfolio: Portfolio) => {
    setActivePortfolio(portfolio.id);
    navigate(`/portfolios/${portfolio.id}`);
  };
  
  // Always show the welcome screen in Dashboard
  return (
    <>
      <WelcomeScreen />
      <AddPortfolioDialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen} />
    </>
  );
};

export default Dashboard;