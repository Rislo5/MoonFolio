import { pgTable, text, serial, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Basic user model (unchanged)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Wallets model
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  type: text("type").notNull(), // "ens" or "manual"
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  name: true,
  address: true,
  type: true,
  userId: true,
});

// Assets model
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  quantity: numeric("quantity").notNull(),
  avgPrice: numeric("avg_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssetSchema = createInsertSchema(assets).pick({
  walletId: true,
  symbol: true,
  name: true,
  quantity: true,
  avgPrice: true,
});

// Transactions model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  type: text("type").notNull(), // "buy", "sell", "swap", "transfer"
  assetSymbol: text("asset_symbol").notNull(),
  assetName: text("asset_name").notNull(),
  quantity: numeric("quantity").notNull(),
  price: numeric("price").notNull(),
  value: numeric("value").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  walletId: true,
  type: true,
  assetSymbol: true,
  assetName: true,
  quantity: true,
  price: true,
  value: true,
  date: true,
  notes: true,
  metadata: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
