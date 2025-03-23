import { 
  users, 
  portfolios, 
  assets, 
  transactions, 
  type User, 
  type InsertUser, 
  type Portfolio, 
  type InsertPortfolio,
  type Asset,
  type InsertAsset,
  type Transaction,
  type InsertTransaction,
  type AssetWithPrice,
  type TransactionWithDetails,
  type PortfolioOverview,
  type ChartData,
  type EnsWalletData
} from "@shared/schema";

// Interface for the storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Portfolio methods
  getPortfolios(userId?: number): Promise<Portfolio[]>;
  getPortfolio(id: number): Promise<Portfolio | undefined>;
  getPortfolioByAddress(address: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: number, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: number): Promise<boolean>;
  
  // Asset methods
  getAssets(portfolioId: number): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetBySymbolAndPortfolio(symbol: string, portfolioId: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;
  
  // Transaction methods
  getTransactions(portfolioId: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
}

// Implementation of in-memory storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<number, Portfolio>;
  private assets: Map<number, Asset>;
  private transactions: Map<number, Transaction>;
  
  private userId: number;
  private portfolioId: number;
  private assetId: number;
  private transactionId: number;
  
  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.assets = new Map();
    this.transactions = new Map();
    
    this.userId = 1;
    this.portfolioId = 1;
    this.assetId = 1;
    this.transactionId = 1;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Portfolio methods
  async getPortfolios(userId?: number): Promise<Portfolio[]> {
    if (userId) {
      return Array.from(this.portfolios.values()).filter(
        (portfolio) => portfolio.userId === userId
      );
    }
    return Array.from(this.portfolios.values());
  }
  
  async getPortfolio(id: number): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }
  
  async getPortfolioByAddress(address: string): Promise<Portfolio | undefined> {
    return Array.from(this.portfolios.values()).find(
      (portfolio) => portfolio.walletAddress?.toLowerCase() === address.toLowerCase()
    );
  }
  
  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.portfolioId++;
    const now = new Date();
    const portfolio: Portfolio = { 
      ...insertPortfolio, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }
  
  async updatePortfolio(id: number, portfolioUpdate: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;
    
    const updatedPortfolio: Portfolio = { 
      ...portfolio, 
      ...portfolioUpdate,
      updatedAt: new Date()
    };
    
    this.portfolios.set(id, updatedPortfolio);
    return updatedPortfolio;
  }
  
  async deletePortfolio(id: number): Promise<boolean> {
    // Delete related assets and transactions first
    const portfolioAssets = Array.from(this.assets.values()).filter(
      (asset) => asset.portfolioId === id
    );
    
    for (const asset of portfolioAssets) {
      await this.deleteAsset(asset.id);
    }
    
    return this.portfolios.delete(id);
  }
  
  // Asset methods
  async getAssets(portfolioId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.portfolioId === portfolioId
    );
  }
  
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }
  
  async getAssetBySymbolAndPortfolio(symbol: string, portfolioId: number): Promise<Asset | undefined> {
    return Array.from(this.assets.values()).find(
      (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase() && 
                asset.portfolioId === portfolioId
    );
  }
  
  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetId++;
    const now = new Date();
    const asset: Asset = { 
      ...insertAsset, 
      id, 
      createdAt: now, 
      updatedAt: now,
      // Convert numeric string values to numbers for storage
      balance: typeof insertAsset.balance === 'string' 
        ? parseFloat(insertAsset.balance) 
        : insertAsset.balance,
      avgBuyPrice: insertAsset.avgBuyPrice && typeof insertAsset.avgBuyPrice === 'string'
        ? parseFloat(insertAsset.avgBuyPrice)
        : insertAsset.avgBuyPrice
    };
    
    this.assets.set(id, asset);
    return asset;
  }
  
  async updateAsset(id: number, assetUpdate: Partial<InsertAsset>): Promise<Asset | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;
    
    // Handle numeric conversions if needed
    if (assetUpdate.balance && typeof assetUpdate.balance === 'string') {
      assetUpdate.balance = parseFloat(assetUpdate.balance);
    }
    
    if (assetUpdate.avgBuyPrice && typeof assetUpdate.avgBuyPrice === 'string') {
      assetUpdate.avgBuyPrice = parseFloat(assetUpdate.avgBuyPrice);
    }
    
    const updatedAsset: Asset = { 
      ...asset, 
      ...assetUpdate,
      updatedAt: new Date()
    };
    
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }
  
  async deleteAsset(id: number): Promise<boolean> {
    // Delete related transactions first
    const assetTransactions = Array.from(this.transactions.values()).filter(
      (tx) => tx.assetId === id || tx.toAssetId === id
    );
    
    for (const tx of assetTransactions) {
      this.transactions.delete(tx.id);
    }
    
    return this.assets.delete(id);
  }
  
  // Transaction methods
  async getTransactions(portfolioId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.portfolioId === portfolioId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date desc
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    
    // Handle numeric conversions if needed
    const amount = typeof insertTransaction.amount === 'string' 
      ? parseFloat(insertTransaction.amount) 
      : insertTransaction.amount;
      
    const price = insertTransaction.price && typeof insertTransaction.price === 'string'
      ? parseFloat(insertTransaction.price)
      : insertTransaction.price;
      
    const toAmount = insertTransaction.toAmount && typeof insertTransaction.toAmount === 'string'
      ? parseFloat(insertTransaction.toAmount)
      : insertTransaction.toAmount;
      
    const toPrice = insertTransaction.toPrice && typeof insertTransaction.toPrice === 'string'
      ? parseFloat(insertTransaction.toPrice)
      : insertTransaction.toPrice;
    
    const transaction: Transaction = { 
      ...insertTransaction,
      amount,
      price,
      toAmount,
      toPrice,
      id, 
      createdAt: new Date(),
      date: insertTransaction.date || new Date()
    };
    
    this.transactions.set(id, transaction);
    
    // Update asset balance based on transaction
    const asset = await this.getAsset(transaction.assetId);
    if (asset) {
      const newBalance = this.calculateNewBalance(asset, transaction);
      const newAvgBuyPrice = this.calculateNewAvgBuyPrice(asset, transaction);
      
      await this.updateAsset(asset.id, {
        balance: newBalance,
        avgBuyPrice: newAvgBuyPrice
      });
    }
    
    // If it's a swap, update the "to" asset as well
    if (transaction.type === 'swap' && transaction.toAssetId && transaction.toAmount) {
      const toAsset = await this.getAsset(transaction.toAssetId);
      if (toAsset) {
        await this.updateAsset(toAsset.id, {
          balance: Number(toAsset.balance) + Number(transaction.toAmount)
        });
      }
    }
    
    return transaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    // For simplicity, we're not recalculating balances on transaction updates
    // In a real app, this would need to reverse previous effects and apply new ones
    
    // Handle numeric conversions if needed
    if (transactionUpdate.amount && typeof transactionUpdate.amount === 'string') {
      transactionUpdate.amount = parseFloat(transactionUpdate.amount);
    }
    
    if (transactionUpdate.price && typeof transactionUpdate.price === 'string') {
      transactionUpdate.price = parseFloat(transactionUpdate.price);
    }
    
    if (transactionUpdate.toAmount && typeof transactionUpdate.toAmount === 'string') {
      transactionUpdate.toAmount = parseFloat(transactionUpdate.toAmount);
    }
    
    if (transactionUpdate.toPrice && typeof transactionUpdate.toPrice === 'string') {
      transactionUpdate.toPrice = parseFloat(transactionUpdate.toPrice);
    }
    
    const updatedTransaction: Transaction = { 
      ...transaction, 
      ...transactionUpdate 
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    // For simplicity, we're not recalculating balances when deleting transactions
    // In a real app, we would need to reverse the effects of this transaction
    return this.transactions.delete(id);
  }
  
  // Helper methods for balance calculations
  private calculateNewBalance(asset: Asset, transaction: Transaction): number {
    const currentBalance = Number(asset.balance);
    const txAmount = Number(transaction.amount);
    
    switch (transaction.type) {
      case 'buy':
      case 'deposit':
        return currentBalance + txAmount;
      case 'sell':
      case 'withdraw':
        return currentBalance - txAmount;
      case 'swap':
        return currentBalance - txAmount;
      default:
        return currentBalance;
    }
  }
  
  private calculateNewAvgBuyPrice(asset: Asset, transaction: Transaction): number | null {
    // Only recalculate for buy transactions
    if (transaction.type !== 'buy' || !transaction.price) {
      return asset.avgBuyPrice;
    }
    
    const currentBalance = Number(asset.balance);
    const currentAvgPrice = Number(asset.avgBuyPrice) || 0;
    const txAmount = Number(transaction.amount);
    const txPrice = Number(transaction.price);
    
    // Calculate weighted average
    const totalValue = (currentBalance * currentAvgPrice) + (txAmount * txPrice);
    const newTotalAmount = currentBalance + txAmount;
    
    if (newTotalAmount <= 0) return null;
    
    return totalValue / newTotalAmount;
  }
}

// Import the PostgresStorage implementation
import { PostgresStorage } from './pg-storage';

// Export the appropriate storage implementation based on environment
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
