import { useContext } from "react";
import { PortfolioContext } from "@/contexts/portfolio-context";

export const usePortfolio = () => useContext(PortfolioContext);
