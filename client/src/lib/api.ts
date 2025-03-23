import {
  AssetWithPrice,
  ChartData,
  EnsWalletData,
  Portfolio,
  PortfolioOverview,
  TransactionWithDetails,
} from "@shared/schema";
import { apiRequest } from "./queryClient";

// CoinGecko API related functions
export async function fetchPopularCryptos() {
  const response = await fetch("/api/crypto/popular");
  if (!response.ok) {
    throw new Error("Failed to fetch popular cryptocurrencies");
  }
  return response.json();
}

export async function searchCryptos(query: string) {
  const response = await fetch(`/api/crypto/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error("Failed to search cryptocurrencies");
  }
  return response.json();
}

export async function fetchCryptoPrice(id: string) {
  const response = await fetch(`/api/crypto/price/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${id}`);
  }
  return response.json();
}

export async function fetchCryptoHistory(id: string, days: string) {
  const response = await fetch(`/api/crypto/history/${id}/${days}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history for ${id}`);
  }
  return response.json();
}

// ENS related functions
export async function resolveEnsName(name: string): Promise<{ address: string; ensName: string | null }> {
  const response = await fetch(`/api/ens/resolve/${name}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to resolve ENS name");
  }
  return response.json();
}

export async function fetchWalletAssets(address: string): Promise<EnsWalletData> {
  const response = await fetch(`/api/wallet/${address}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch wallet assets");
  }
  return response.json();
}

// Portfolio related functions
export async function createPortfolio(data: {
  name: string;
  walletAddress?: string;
  isEns?: boolean;
  ensName?: string;
}): Promise<Portfolio> {
  const response = await apiRequest("POST", "/api/portfolios", data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create portfolio");
  }
  return response.json();
}

export async function fetchPortfolios(): Promise<Portfolio[]> {
  const response = await fetch("/api/portfolios");
  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  return response.json();
}

export async function fetchPortfolio(id: number): Promise<Portfolio> {
  const response = await fetch(`/api/portfolios/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio");
  }
  return response.json();
}

export async function updatePortfolio(id: number, data: Partial<Portfolio>): Promise<Portfolio> {
  const response = await apiRequest("PUT", `/api/portfolios/${id}`, data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update portfolio");
  }
  return response.json();
}

export async function deletePortfolio(id: number): Promise<void> {
  const response = await apiRequest("DELETE", `/api/portfolios/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete portfolio");
  }
}

// Asset related functions
export async function createAsset(
  portfolioId: number,
  data: {
    name: string;
    symbol: string;
    coinGeckoId: string;
    balance: number;
    avgBuyPrice?: number;
    imageUrl?: string;
  }
): Promise<AssetWithPrice> {
  const response = await apiRequest(
    "POST",
    `/api/portfolios/${portfolioId}/assets`,
    data
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create asset");
  }
  return response.json();
}

export async function fetchAssets(portfolioId: number): Promise<AssetWithPrice[]> {
  const response = await fetch(`/api/portfolios/${portfolioId}/assets`);
  if (!response.ok) {
    throw new Error("Failed to fetch assets");
  }
  return response.json();
}

export async function updateAsset(
  id: number,
  data: Partial<{
    name: string;
    symbol: string;
    coinGeckoId: string;
    balance: number;
    avgBuyPrice: number;
    imageUrl: string;
  }>
): Promise<AssetWithPrice> {
  const response = await apiRequest("PUT", `/api/assets/${id}`, data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update asset");
  }
  return response.json();
}

export async function deleteAsset(id: number): Promise<void> {
  const response = await apiRequest("DELETE", `/api/assets/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete asset");
  }
}

// Transaction related functions
export async function createTransaction(
  portfolioId: number,
  data: {
    assetId: number;
    type: string;
    amount: number;
    price?: number;
    toAssetId?: number;
    toAmount?: number;
    toPrice?: number;
    date?: string;
    status?: string;
  }
): Promise<TransactionWithDetails> {
  const response = await apiRequest(
    "POST",
    `/api/portfolios/${portfolioId}/transactions`,
    data
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create transaction");
  }
  return response.json();
}

export async function fetchTransactions(portfolioId: number): Promise<TransactionWithDetails[]> {
  const response = await fetch(`/api/portfolios/${portfolioId}/transactions`);
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return response.json();
}

export async function updateTransaction(
  id: number,
  data: Partial<{
    assetId: number;
    type: string;
    amount: number;
    price: number;
    toAssetId: number;
    toAmount: number;
    toPrice: number;
    date: string;
    status: string;
  }>
): Promise<TransactionWithDetails> {
  const response = await apiRequest("PUT", `/api/transactions/${id}`, data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update transaction");
  }
  return response.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const response = await apiRequest("DELETE", `/api/transactions/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete transaction");
  }
}

// Portfolio overview
export async function fetchPortfolioOverview(id: number): Promise<PortfolioOverview> {
  const response = await fetch(`/api/portfolios/${id}/overview`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio overview");
  }
  return response.json();
}

// Mock functions for generating chart data - these would normally come from the API
// but are implemented client-side for simplicity
export async function generatePortfolioChartData(timeframe: string): Promise<ChartData> {
  // This would normally fetch from an API endpoint
  const days = timeframeToDays(timeframe);
  const dates = generateDates(days);
  
  // Generate some plausible looking data with a general upward trend
  let startValue = 100000 + Math.random() * 20000;
  const values = [startValue];
  
  for (let i = 1; i < dates.length; i++) {
    // Random walk with a slight positive bias
    const changePercent = (Math.random() * 0.06) - 0.02; // Between -2% and +4%
    startValue = startValue * (1 + changePercent);
    values.push(startValue);
  }
  
  return {
    labels: dates,
    values: values
  };
}

// Helper function to convert timeframe to days
function timeframeToDays(timeframe: string): number {
  switch (timeframe) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '1y':
      return 365;
    case 'all':
      return 1095; // 3 years as "all"
    default:
      return 7;
  }
}

// Helper function to generate date labels
function generateDates(days: number): string[] {
  const dates = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  return dates;
}
