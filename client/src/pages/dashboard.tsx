import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { fetchPortfolios } from "@/lib/api";
import { Portfolio, AssetWithPrice } from "@shared/schema";

// Estende il tipo Portfolio con la proprietà isActive
type ExtendedPortfolio = Portfolio & {
  isActive?: boolean;
};
import WelcomeScreen from "@/components/welcome-screen";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Wallet, 
  ArrowUpRight, 
  BarChart3,
  LineChart,
  Trash2,
  CoinsIcon,
  Calendar
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";
import { TransferAssetDialog } from "@/components/portfolio/transfer-asset-dialog";
import { DeletePortfolioDialog } from "@/components/portfolio/delete-portfolio-dialog";
import AddAssetDialog from "@/components/portfolio/add-asset-dialog";
import PortfolioCharts from "@/components/portfolio/portfolio-charts";
import AssetDetailTable from "@/components/portfolio/asset-detail-table";
import TransactionDetailList from "@/components/portfolio/transaction-detail-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Format timestamp to readable date
const formatTimestamp = (timestamp: string | Date | null) => {
  if (!timestamp) return "Unknown";
  return formatDate(new Date(timestamp));
};

const Dashboard = () => {
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  
  // Always show welcome screen when on Dashboard page
  // This ensures that clicking on Dashboard brings the user to the welcome screen
  return (
    <>
      <WelcomeScreen />
      <AddPortfolioDialog open={isAddPortfolioOpen} onOpenChange={setIsAddPortfolioOpen} />
    </>
  );
};

export default Dashboard;