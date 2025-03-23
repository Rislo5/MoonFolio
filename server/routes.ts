import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWalletSchema, 
  insertAssetSchema, 
  insertTransactionSchema
} from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";

// API keys from environment variables
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;

export async function registerRoutes(app: Express): Promise<Server> {
  // Wallet routes
  app.post('/api/wallets', async (req, res) => {
    try {
      const wallet = insertWalletSchema.parse(req.body);
      const createdWallet = await storage.createWallet(wallet);
      res.status(201).json(createdWallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create wallet' });
      }
    }
  });

  app.get('/api/wallets/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const wallet = await storage.getWallet(id);
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve wallet' });
    }
  });

  // Assets routes
  app.post('/api/assets', async (req, res) => {
    try {
      const asset = insertAssetSchema.parse(req.body);
      const createdAsset = await storage.createAsset(asset);
      res.status(201).json(createdAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create asset' });
      }
    }
  });

  app.get('/api/wallets/:walletId/assets', async (req, res) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const assets = await storage.getAssetsByWalletId(walletId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve assets' });
    }
  });

  // Transactions routes
  app.post('/api/transactions', async (req, res) => {
    try {
      const transaction = insertTransactionSchema.parse(req.body);
      const createdTransaction = await storage.createTransaction(transaction);
      res.status(201).json(createdTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create transaction' });
      }
    }
  });

  app.get('/api/wallets/:walletId/transactions', async (req, res) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const transactions = await storage.getTransactionsByWalletId(walletId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
  });

  // CoinGecko API proxy
  app.get('/api/crypto/prices', async (req, res) => {
    try {
      const coinIds = req.query.ids as string;
      if (!coinIds) {
        return res.status(400).json({ error: 'Missing coin IDs' });
      }
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24h_change=true`;
      const headers: Record<string, string> = {};
      
      if (COINGECKO_API_KEY) {
        headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch crypto prices' });
    }
  });

  app.get('/api/crypto/coins/list', async (req, res) => {
    try {
      const url = 'https://api.coingecko.com/api/v3/coins/list';
      const headers: Record<string, string> = {};
      
      if (COINGECKO_API_KEY) {
        headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch coin list' });
    }
  });

  // ENS resolution via Infura
  app.get('/api/ens/resolve/:address', async (req, res) => {
    try {
      const address = req.params.address;
      
      // Check if it's an ENS name (ends with .eth)
      const isEns = address.toLowerCase().endsWith('.eth');
      
      if (!isEns && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid address format' });
      }
      
      if (!INFURA_API_KEY) {
        return res.status(500).json({ error: 'Infura API key not configured' });
      }
      
      // For demonstration, we're returning a simple mock response
      // In a real app, we would use the JSON-RPC API to resolve ENS names
      if (isEns) {
        // Simulate ENS resolution (would use ethers.js in real implementation)
        res.json({ 
          originalInput: address,
          resolvedAddress: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` 
        });
      } else {
        // If it's already an address, just return it
        res.json({ 
          originalInput: address,
          resolvedAddress: address 
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve ENS address' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
