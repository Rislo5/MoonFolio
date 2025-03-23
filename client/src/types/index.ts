// Wallet related types
export interface Wallet {
  id: number;
  name: string;
  address?: string | null;
  type: "ens" | "manual";
  userId?: number | null;
  createdAt: string;
}

export interface InsertWallet {
  name: string;
  address?: string | null;
  type: "ens" | "manual";
  userId?: number | null;
}

// Asset related types
export interface Asset {
  id: number;
  walletId: number;
  symbol: string;
  name: string;
  quantity: string;
  avgPrice: string;
  createdAt: string;
  // Runtime properties (not stored in DB)
  currentPrice?: number;
  totalValue?: number;
  change24h?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

export interface InsertAsset {
  walletId: number;
  symbol: string;
  name: string;
  quantity: string;
  avgPrice: string;
}

// Transaction related types
export interface Transaction {
  id: number;
  walletId: number;
  type: TransactionType;
  assetSymbol: string;
  assetName: string;
  quantity: string;
  price: string;
  value: string;
  date: string;
  notes?: string | null;
  metadata?: Record<string, any> | null;
}

export interface InsertTransaction {
  walletId: number;
  type: TransactionType;
  assetSymbol: string;
  assetName: string;
  quantity: string;
  price: string;
  value: string;
  date: string;
  notes?: string | null;
  metadata?: Record<string, any> | null;
}

export type TransactionType = "buy" | "sell" | "swap" | "transfer";

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface PieChartData {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

// User related types (from existing schema)
export interface User {
  id: number;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

// API response types for external services
export interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

export interface ENSResolveResponse {
  originalInput: string;
  resolvedAddress: string;
}
