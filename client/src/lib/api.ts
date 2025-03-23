import { apiRequest } from "./queryClient";
import { 
  Asset, 
  Transaction, 
  Wallet,
  InsertWallet,
  InsertAsset,
  InsertTransaction
} from "../types";

// Wallet APIs
export async function createWallet(walletData: InsertWallet): Promise<Wallet> {
  const res = await apiRequest("POST", "/api/wallets", walletData);
  return res.json();
}

export async function getWallet(id: number): Promise<Wallet> {
  const res = await apiRequest("GET", `/api/wallets/${id}`);
  return res.json();
}

// Asset APIs
export async function createAsset(assetData: InsertAsset): Promise<Asset> {
  const res = await apiRequest("POST", "/api/assets", assetData);
  return res.json();
}

export async function getAssetsByWalletId(walletId: number): Promise<Asset[]> {
  const res = await apiRequest("GET", `/api/wallets/${walletId}/assets`);
  return res.json();
}

// Transaction APIs
export async function createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
  const res = await apiRequest("POST", "/api/transactions", transactionData);
  return res.json();
}

export async function getTransactionsByWalletId(walletId: number): Promise<Transaction[]> {
  const res = await apiRequest("GET", `/api/wallets/${walletId}/transactions`);
  return res.json();
}

// CoinGecko APIs
export async function getCryptoPrices(coinIds: string[]): Promise<Record<string, { usd: number, usd_24h_change: number }>> {
  const res = await apiRequest("GET", `/api/crypto/prices?ids=${coinIds.join(',')}`);
  return res.json();
}

export async function getCoinsList(): Promise<Array<{ id: string, symbol: string, name: string }>> {
  const res = await apiRequest("GET", `/api/crypto/coins/list`);
  return res.json();
}

// ENS APIs
export async function resolveEnsAddress(address: string): Promise<{ originalInput: string, resolvedAddress: string }> {
  const res = await apiRequest("GET", `/api/ens/resolve/${address}`);
  return res.json();
}
