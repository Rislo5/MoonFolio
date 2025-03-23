import { pgTable, text, serial, integer, boolean, timestamp, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model - basic user information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Portfolio model - represents a crypto portfolio (manual or ENS)
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  walletAddress: text("wallet_address"),
  isEns: boolean("is_ens").default(false),
  ensName: text("ens_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Asset model - represents a crypto asset in a portfolio
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id).notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  coinGeckoId: text("coin_gecko_id").notNull(),
  balance: numeric("balance", { precision: 18, scale: 8 }).notNull(),
  avgBuyPrice: numeric("avg_buy_price", { precision: 18, scale: 8 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Transaction model - represents a crypto transaction
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").references(() => portfolios.id).notNull(),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  type: text("type").notNull(), // "buy", "sell", "swap", "deposit", "withdraw"
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 8 }),
  toAssetId: integer("to_asset_id").references(() => assets.id), // For swaps
  toAmount: numeric("to_amount", { precision: 18, scale: 8 }), // For swaps
  toPrice: numeric("to_price", { precision: 18, scale: 8 }), // For swaps
  date: timestamp("date").defaultNow(),
  status: text("status").default("completed"), // "pending", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Define time period for retrieving historical prices
export const timeFrames = ["24h", "7d", "30d", "1y", "all"] as const;
export type TimeFrame = typeof timeFrames[number];

// Define cryptocurrency data from coingecko
export type CryptoCurrency = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
};

// Type definitions for schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Define the type for ENS wallet data
export type EnsWalletData = {
  address: string;
  ensName?: string;
  assets: {
    name: string;
    symbol: string;
    coinGeckoId: string;
    balance: number;
    imageUrl: string;
  }[];
};

// Define types for portfolio overview data
export type PortfolioOverview = {
  totalValue: number;
  change24h: number;
  change24hPercentage: number;
  lastUpdated: string;
};

// Define types for chart data
export type ChartData = {
  labels: string[];
  values: number[];
};

// Define asset with price data
export type AssetWithPrice = Asset & {
  currentPrice: number;
  value: number;
  priceChange24h: number;
  profitLoss: number;
  profitLossPercentage: number;
};

// Define transaction with details
export type TransactionWithDetails = Transaction & {
  asset: {
    name: string;
    symbol: string;
    imageUrl: string;
  };
  toAsset?: {
    name: string;
    symbol: string;
    imageUrl: string;
  };
  value: number;
};
