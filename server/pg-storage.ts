import { User, InsertUser, Portfolio, InsertPortfolio, Asset, InsertAsset, Transaction, InsertTransaction } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import { db } from "./db";
import { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  constructor() {
    if (!db) {
      throw new Error("Database connection not established");
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return users[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await db.insert(schema.users).values(insertUser).returning();
    return users[0];
  }
  
  async getPortfolios(userId?: number): Promise<Portfolio[]> {
    if (userId !== undefined) {
      return db.select().from(schema.portfolios).where(eq(schema.portfolios.userId, userId));
    }
    return db.select().from(schema.portfolios);
  }
  
  async getPortfolio(id: number): Promise<Portfolio | undefined> {
    const portfolios = await db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id));
    return portfolios[0];
  }
  
  async getPortfolioByAddress(address: string): Promise<Portfolio | undefined> {
    const normalizedAddress = address.toLowerCase();
    const portfolios = await db.select().from(schema.portfolios)
      .where(eq(schema.portfolios.walletAddress, normalizedAddress));
    return portfolios[0];
  }
  
  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    // Normalize wallet address if present
    const preparedPortfolio = insertPortfolio.walletAddress 
      ? {...insertPortfolio, walletAddress: insertPortfolio.walletAddress.toLowerCase()}
      : insertPortfolio;
      
    const portfolios = await db.insert(schema.portfolios).values(preparedPortfolio).returning();
    return portfolios[0];
  }
  
  async updatePortfolio(id: number, portfolioUpdate: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    // Normalize wallet address if present
    const preparedUpdate = portfolioUpdate.walletAddress 
      ? {...portfolioUpdate, walletAddress: portfolioUpdate.walletAddress.toLowerCase()}
      : portfolioUpdate;
      
    const portfolios = await db.update(schema.portfolios)
      .set({...preparedUpdate, updatedAt: new Date()})
      .where(eq(schema.portfolios.id, id))
      .returning();
      
    return portfolios[0];
  }
  
  async deletePortfolio(id: number): Promise<boolean> {
    // First delete related assets and transactions
    const assets = await this.getAssets(id);
    for (const asset of assets) {
      await this.deleteAsset(asset.id);
    }
    
    const result = await db.delete(schema.portfolios)
      .where(eq(schema.portfolios.id, id))
      .returning({id: schema.portfolios.id});
      
    return result.length > 0;
  }
  
  async getAssets(portfolioId: number): Promise<Asset[]> {
    return db.select().from(schema.assets)
      .where(eq(schema.assets.portfolioId, portfolioId));
  }
  
  async getAsset(id: number): Promise<Asset | undefined> {
    const assets = await db.select().from(schema.assets)
      .where(eq(schema.assets.id, id));
    return assets[0];
  }
  
  async getAssetBySymbolAndPortfolio(symbol: string, portfolioId: number): Promise<Asset | undefined> {
    const assets = await db.select().from(schema.assets)
      .where(and(
        eq(schema.assets.symbol, symbol),
        eq(schema.assets.portfolioId, portfolioId)
      ));
    return assets[0];
  }
  
  async createAsset(asset: InsertAsset): Promise<Asset> {
    const assets = await db.insert(schema.assets).values(asset).returning();
    return assets[0];
  }
  
  async updateAsset(id: number, assetUpdate: Partial<InsertAsset>): Promise<Asset | undefined> {
    // Get current asset
    const currentAsset = await this.getAsset(id);
    if (!currentAsset) return undefined;
    
    // If updating balance, handle transaction logic
    if (assetUpdate.balance !== undefined && assetUpdate.balance !== currentAsset.balance) {
      const portfolio = await this.getPortfolio(currentAsset.portfolioId);
      if (!portfolio) throw new Error("Portfolio not found");
      
      // Create a transaction to record the change
      const transaction: InsertTransaction = {
        portfolioId: currentAsset.portfolioId,
        assetId: id,
        type: Number(assetUpdate.balance) > Number(currentAsset.balance) ? "buy" : "sell",
        amount: Math.abs(Number(assetUpdate.balance) - Number(currentAsset.balance)).toString(),
        price: assetUpdate.avgBuyPrice || currentAsset.avgBuyPrice,
        date: new Date()
      };
      
      await this.createTransaction(transaction);
    }
    
    const assets = await db.update(schema.assets)
      .set({...assetUpdate, updatedAt: new Date()})
      .where(eq(schema.assets.id, id))
      .returning();
      
    return assets[0];
  }
  
  async deleteAsset(id: number): Promise<boolean> {
    // First delete related transactions
    const transactions = await db.select().from(schema.transactions)
      .where(eq(schema.transactions.assetId, id));
      
    for (const transaction of transactions) {
      await this.deleteTransaction(transaction.id);
    }
    
    // Also delete transactions where this asset is the toAsset
    const toTransactions = await db.select().from(schema.transactions)
      .where(eq(schema.transactions.toAssetId, id));
      
    for (const transaction of toTransactions) {
      await this.deleteTransaction(transaction.id);
    }
    
    const result = await db.delete(schema.assets)
      .where(eq(schema.assets.id, id))
      .returning({id: schema.assets.id});
      
    return result.length > 0;
  }
  
  async getTransactions(portfolioId: number): Promise<Transaction[]> {
    return db.select().from(schema.transactions)
      .where(eq(schema.transactions.portfolioId, portfolioId))
      .orderBy(schema.transactions.date);
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const transactions = await db.select().from(schema.transactions)
      .where(eq(schema.transactions.id, id));
    return transactions[0];
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transactions = await db.insert(schema.transactions)
      .values(insertTransaction)
      .returning();
      
    const transaction = transactions[0];
    
    // Update asset balance and avg price
    if (transaction.type === "buy" || transaction.type === "sell") {
      const asset = await this.getAsset(transaction.assetId);
      if (!asset) throw new Error("Asset not found");
      
      // Calculate new balance
      const newBalance = this.calculateNewBalance(asset, transaction);
      
      // Calculate new average buy price (only for buys)
      let newAvgBuyPrice = asset.avgBuyPrice;
      if (transaction.type === "buy" && transaction.price) {
        newAvgBuyPrice = this.calculateNewAvgBuyPrice(asset, transaction);
      }
      
      // Update the asset
      await db.update(schema.assets)
        .set({
          balance: newBalance.toString(),
          avgBuyPrice: newAvgBuyPrice?.toString(),
          updatedAt: new Date()
        })
        .where(eq(schema.assets.id, asset.id));
    }
    
    return transaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    // Get current transaction
    const currentTransaction = await this.getTransaction(id);
    if (!currentTransaction) return undefined;
    
    // If updating critical data, reject for now (would need to recalculate asset balances)
    if (
      transactionUpdate.amount !== undefined ||
      transactionUpdate.price !== undefined ||
      transactionUpdate.type !== undefined
    ) {
      throw new Error("Updating transaction amount, price, or type is not supported at this time");
    }
    
    const transactions = await db.update(schema.transactions)
      .set(transactionUpdate)
      .where(eq(schema.transactions.id, id))
      .returning();
      
    return transactions[0];
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    // TODO: Should revert the effects of the transaction on the asset
    // For now just delete
    const result = await db.delete(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .returning({id: schema.transactions.id});
      
    return result.length > 0;
  }
  
  private calculateNewBalance(asset: Asset, transaction: Transaction): number {
    const currentBalance = Number(asset.balance);
    const transactionAmount = Number(transaction.amount);
    
    if (transaction.type === "buy") {
      return currentBalance + transactionAmount;
    } else if (transaction.type === "sell") {
      return currentBalance - transactionAmount;
    }
    
    return currentBalance;
  }
  
  private calculateNewAvgBuyPrice(asset: Asset, transaction: Transaction): number | null {
    const currentBalance = Number(asset.balance);
    const currentAvgPrice = asset.avgBuyPrice ? Number(asset.avgBuyPrice) : 0;
    const transactionAmount = Number(transaction.amount);
    const transactionPrice = transaction.price ? Number(transaction.price) : 0;
    
    // If we don't have a price, can't calculate
    if (!transactionPrice) return currentAvgPrice;
    
    // If it's the first purchase
    if (currentBalance === 0 || !currentAvgPrice) {
      return transactionPrice;
    }
    
    // Calculate weighted average of existing holdings and new purchase
    const totalValue = currentBalance * currentAvgPrice + transactionAmount * transactionPrice;
    const totalAmount = currentBalance + transactionAmount;
    
    return totalValue / totalAmount;
  }
}