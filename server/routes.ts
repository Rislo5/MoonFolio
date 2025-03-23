import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import { z } from "zod";
import {
  insertPortfolioSchema,
  insertAssetSchema,
  insertTransactionSchema,
} from "@shared/schema";

// Environment variables
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";

// API URLs
const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Get popular cryptocurrencies with their current prices
  app.get("/api/crypto/popular", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h${
          COINGECKO_API_KEY ? `&x_cg_api_key=${COINGECKO_API_KEY}` : ""
        }`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching popular cryptocurrencies:", error);
      res.status(500).json({
        message: "Failed to fetch cryptocurrency data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Search for cryptocurrencies
  app.get("/api/crypto/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      // Implementiamo un semplice sistema di fallback in caso di problemi con l'API
      let data;
      
      try {
        const response = await fetch(
          `${COINGECKO_API_URL}/search?query=${query}${
            COINGECKO_API_KEY ? `&x_cg_api_key=${COINGECKO_API_KEY}` : ""
          }`
        );
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.statusText}`);
        }
        
        data = await response.json();
      } catch (error) {
        console.error("Error searching cryptocurrencies, using fallback data:", error);
        
        // Dati di fallback solo per alcune monete popolari in caso di errore
        if (query.toLowerCase().includes("bitcoin") || query.toLowerCase().includes("btc")) {
          data = {
            coins: [
              { id: "bitcoin", name: "Bitcoin", symbol: "BTC", thumb: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png" }
            ]
          };
        } else if (query.toLowerCase().includes("ethereum") || query.toLowerCase().includes("eth")) {
          data = {
            coins: [
              { id: "ethereum", name: "Ethereum", symbol: "ETH", thumb: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png" }
            ]
          };
        } else if (query.toLowerCase().includes("tether") || query.toLowerCase().includes("usdt")) {
          data = {
            coins: [
              { id: "tether", name: "Tether", symbol: "USDT", thumb: "https://assets.coingecko.com/coins/images/325/thumb/Tether.png" }
            ]
          };
        } else {
          data = { coins: [] };
        }
      }
      
      // Prepariamo i dati per il client con il formato necessario
      const enrichedCoins = data.coins.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toLowerCase(),
        image: coin.thumb,
        market_cap_rank: coin.market_cap_rank
      })).slice(0, 10); // Limita a 10 risultati
      
      res.json(enrichedCoins);
    } catch (error) {
      console.error("Error processing search results:", error);
      res.status(500).json({
        message: "Failed to search cryptocurrency data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get cryptocurrency price
  app.get("/api/crypto/price/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const response = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true${
          COINGECKO_API_KEY ? `&x_cg_api_key=${COINGECKO_API_KEY}` : ""
        }`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error(`Error fetching price for ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to fetch cryptocurrency price",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get cryptocurrency price history
  app.get("/api/crypto/history/:id/:days", async (req: Request, res: Response) => {
    try {
      const { id, days } = req.params;
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}${
          COINGECKO_API_KEY ? `&x_cg_api_key=${COINGECKO_API_KEY}` : ""
        }`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error(`Error fetching history for ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to fetch cryptocurrency price history",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Resolve ENS name to Ethereum address
  app.get("/api/ens/resolve/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      
      // Check if it's already an Ethereum address
      if (/^0x[a-fA-F0-9]{40}$/.test(name)) {
        return res.json({ address: name, ensName: null });
      }
      
      // Check if it's a valid ENS name
      if (!name.endsWith('.eth')) {
        return res.status(400).json({ message: "Invalid ENS name format" });
      }
      
      if (!INFURA_API_KEY) {
        return res.status(500).json({ message: "Infura API key not configured" });
      }
      
      // ENS resolver ABI for name resolution
      const response = await fetch(INFURA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41', // ENS resolver
              data: `0x0178b8bf${Buffer.from(
                name.substring(0, name.lastIndexOf('.')),
                'utf8'
              ).toString('hex').padStart(64, '0')}` // Resolve method
            },
            'latest'
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Infura API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(`Infura API error: ${data.error.message}`);
      }
      
      const address = data.result === '0x0000000000000000000000000000000000000000000000000000000000000000' 
        ? null 
        : `0x${data.result.substring(26)}`;
        
      if (!address) {
        return res.status(404).json({ message: "ENS name not found" });
      }
      
      res.json({ address, ensName: name });
    } catch (error) {
      console.error(`Error resolving ENS name ${req.params.name}:`, error);
      res.status(500).json({
        message: "Failed to resolve ENS name",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get wallet assets (using ETH balances for demo)
  app.get("/api/wallet/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      if (!INFURA_API_KEY) {
        return res.status(500).json({ message: "Infura API key not configured" });
      }
      
      // Check if it's a valid Ethereum address
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ message: "Invalid Ethereum address format" });
      }
      
      // Get ETH balance
      const response = await fetch(INFURA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });
      
      if (!response.ok) {
        throw new Error(`Infura API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(`Infura API error: ${data.error.message}`);
      }
      
      // Convert hex balance to ETH units (wei to ETH)
      const balanceInWei = parseInt(data.result, 16);
      const balanceInEth = balanceInWei / 1e18;
      
      // In a real app, we would fetch token balances as well
      // This is a simplified version just showing ETH balance
      res.json({
        address,
        assets: [
          {
            name: "Ethereum",
            symbol: "ETH",
            coinGeckoId: "ethereum",
            balance: balanceInEth,
            imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
          }
        ]
      });
    } catch (error) {
      console.error(`Error fetching wallet assets for ${req.params.address}:`, error);
      res.status(500).json({
        message: "Failed to fetch wallet assets",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Portfolio routes
  app.post("/api/portfolios", async (req: Request, res: Response) => {
    try {
      const portfolioData = insertPortfolioSchema.parse(req.body);
      const portfolio = await storage.createPortfolio(portfolioData);
      res.status(201).json(portfolio);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      res.status(400).json({
        message: "Failed to create portfolio",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/portfolios", async (_req: Request, res: Response) => {
    try {
      const portfolios = await storage.getPortfolios();
      res.json(portfolios);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      res.status(500).json({
        message: "Failed to fetch portfolios",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/portfolios/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = await storage.getPortfolio(parseInt(id));
      
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error(`Error fetching portfolio ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to fetch portfolio",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.put("/api/portfolios/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const portfolioId = parseInt(id);
      
      // Validate if portfolio exists
      const existingPortfolio = await storage.getPortfolio(portfolioId);
      if (!existingPortfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const portfolioData = insertPortfolioSchema.partial().parse(req.body);
      const updatedPortfolio = await storage.updatePortfolio(portfolioId, portfolioData);
      
      res.json(updatedPortfolio);
    } catch (error) {
      console.error(`Error updating portfolio ${req.params.id}:`, error);
      res.status(400).json({
        message: "Failed to update portfolio",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.delete("/api/portfolios/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const portfolioId = parseInt(id);
      
      // Validate if portfolio exists
      const existingPortfolio = await storage.getPortfolio(portfolioId);
      if (!existingPortfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      await storage.deletePortfolio(portfolioId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting portfolio ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to delete portfolio",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Asset routes
  app.post("/api/portfolios/:portfolioId/assets", async (req: Request, res: Response) => {
    try {
      const { portfolioId } = req.params;
      const portfolioIdNum = parseInt(portfolioId);
      
      // Validate if portfolio exists
      const portfolio = await storage.getPortfolio(portfolioIdNum);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      // Add portfolio ID to asset data
      const assetData = insertAssetSchema.parse({
        ...req.body,
        portfolioId: portfolioIdNum
      });
      
      // Check if asset already exists in portfolio
      const existingAsset = await storage.getAssetBySymbolAndPortfolio(
        assetData.symbol,
        portfolioIdNum
      );
      
      if (existingAsset) {
        // Update existing asset balance instead of creating a new one
        const updatedBalance = Number(existingAsset.balance) + Number(assetData.balance);
        const updatedAsset = await storage.updateAsset(existingAsset.id, {
          balance: updatedBalance
        });
        return res.json(updatedAsset);
      }
      
      const asset = await storage.createAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      console.error(`Error creating asset in portfolio ${req.params.portfolioId}:`, error);
      res.status(400).json({
        message: "Failed to create asset",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/portfolios/:portfolioId/assets", async (req: Request, res: Response) => {
    try {
      const { portfolioId } = req.params;
      const portfolioIdNum = parseInt(portfolioId);
      
      // Validate if portfolio exists
      const portfolio = await storage.getPortfolio(portfolioIdNum);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const assets = await storage.getAssets(portfolioIdNum);
      
      // Fetch current prices for all assets to calculate total value
      try {
        const coinGeckoIds = assets.map(asset => asset.coinGeckoId).join(',');
        const priceResponse = await fetch(
          `${COINGECKO_API_URL}/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true${
            COINGECKO_API_KEY ? `&x_cg_api_key=${COINGECKO_API_KEY}` : ""
          }`
        );
        
        if (!priceResponse.ok) {
          throw new Error(`CoinGecko API error: ${priceResponse.statusText}`);
        }
        
        const priceData = await priceResponse.json();
        
        // Enhance assets with current price data
        const assetsWithPrices = assets.map(asset => {
          const priceInfo = priceData[asset.coinGeckoId] || { usd: 0, usd_24h_change: 0 };
          const currentPrice = priceInfo.usd;
          const value = Number(asset.balance) * currentPrice;
          const priceChange24h = priceInfo.usd_24h_change || 0;
          
          // Calculate profit/loss
          let profitLoss = 0;
          let profitLossPercentage = 0;
          
          if (asset.avgBuyPrice && currentPrice > 0) {
            profitLoss = (currentPrice - Number(asset.avgBuyPrice)) * Number(asset.balance);
            profitLossPercentage = ((currentPrice / Number(asset.avgBuyPrice)) - 1) * 100;
          }
          
          return {
            ...asset,
            currentPrice,
            value,
            priceChange24h,
            profitLoss,
            profitLossPercentage
          };
        });
        
        res.json(assetsWithPrices);
      } catch (priceError) {
        // If price fetching fails, just return assets without price data
        console.error("Error fetching price data:", priceError);
        res.json(assets);
      }
    } catch (error) {
      console.error(`Error fetching assets for portfolio ${req.params.portfolioId}:`, error);
      res.status(500).json({
        message: "Failed to fetch assets",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const asset = await storage.getAsset(parseInt(id));
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.json(asset);
    } catch (error) {
      console.error(`Error fetching asset ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to fetch asset",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.put("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const assetId = parseInt(id);
      
      // Validate if asset exists
      const existingAsset = await storage.getAsset(assetId);
      if (!existingAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      const assetData = insertAssetSchema.partial().parse(req.body);
      const updatedAsset = await storage.updateAsset(assetId, assetData);
      
      res.json(updatedAsset);
    } catch (error) {
      console.error(`Error updating asset ${req.params.id}:`, error);
      res.status(400).json({
        message: "Failed to update asset",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.delete("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const assetId = parseInt(id);
      
      // Validate if asset exists
      const existingAsset = await storage.getAsset(assetId);
      if (!existingAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      await storage.deleteAsset(assetId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting asset ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to delete asset",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Transaction routes
  app.post("/api/portfolios/:portfolioId/transactions", async (req: Request, res: Response) => {
    try {
      const { portfolioId } = req.params;
      const portfolioIdNum = parseInt(portfolioId);
      
      // Validate if portfolio exists
      const portfolio = await storage.getPortfolio(portfolioIdNum);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      // Add portfolio ID to transaction data
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        portfolioId: portfolioIdNum
      });
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error(`Error creating transaction in portfolio ${req.params.portfolioId}:`, error);
      res.status(400).json({
        message: "Failed to create transaction",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/portfolios/:portfolioId/transactions", async (req: Request, res: Response) => {
    try {
      const { portfolioId } = req.params;
      const portfolioIdNum = parseInt(portfolioId);
      
      // Validate if portfolio exists
      const portfolio = await storage.getPortfolio(portfolioIdNum);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const transactions = await storage.getTransactions(portfolioIdNum);
      
      // Enhance transactions with asset details
      const transactionsWithDetails = await Promise.all(transactions.map(async tx => {
        const asset = await storage.getAsset(tx.assetId);
        let toAsset = null;
        
        if (tx.toAssetId) {
          toAsset = await storage.getAsset(tx.toAssetId);
        }
        
        // Calculate transaction value
        const value = tx.price ? Number(tx.amount) * Number(tx.price) : 0;
        
        return {
          ...tx,
          asset: asset ? {
            name: asset.name,
            symbol: asset.symbol,
            imageUrl: asset.imageUrl
          } : null,
          toAsset: toAsset ? {
            name: toAsset.name,
            symbol: toAsset.symbol,
            imageUrl: toAsset.imageUrl
          } : null,
          value
        };
      }));
      
      res.json(transactionsWithDetails);
    } catch (error) {
      console.error(`Error fetching transactions for portfolio ${req.params.portfolioId}:`, error);
      res.status(500).json({
        message: "Failed to fetch transactions",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(parseInt(id));
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error(`Error fetching transaction ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to fetch transaction",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.put("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transactionId = parseInt(id);
      
      // Validate if transaction exists
      const existingTransaction = await storage.getTransaction(transactionId);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const updatedTransaction = await storage.updateTransaction(transactionId, transactionData);
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error(`Error updating transaction ${req.params.id}:`, error);
      res.status(400).json({
        message: "Failed to update transaction",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const transactionId = parseInt(id);
      
      // Validate if transaction exists
      const existingTransaction = await storage.getTransaction(transactionId);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      await storage.deleteTransaction(transactionId);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting transaction ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to delete transaction",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Portfolio overview
  app.get("/api/portfolios/:id/overview", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const portfolioId = parseInt(id);
      
      // Validate if portfolio exists
      const portfolio = await storage.getPortfolio(portfolioId);
      if (!portfolio) {
        return res.status(404).json({ message: "Portfolio not found" });
      }
      
      const assets = await storage.getAssets(portfolioId);
      
      if (assets.length === 0) {
        return res.json({
          totalValue: 0,
          change24h: 0,
          change24hPercentage: 0,
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Fetch current prices for all assets to calculate total value
      try {
        const coinGeckoIds = assets.map(asset => asset.coinGeckoId).join(',');
        const priceResponse = await fetch(
          `${COINGECKO_API_URL}/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true${
            COINGECKO_API_KEY ? `&x_cg_api_key=${COINGECKO_API_KEY}` : ""
          }`
        );
        
        if (!priceResponse.ok) {
          throw new Error(`CoinGecko API error: ${priceResponse.statusText}`);
        }
        
        const priceData = await priceResponse.json();
        
        // Calculate total portfolio value and 24h change
        let totalValue = 0;
        let previousValue = 0;
        
        assets.forEach(asset => {
          const priceInfo = priceData[asset.coinGeckoId] || { usd: 0, usd_24h_change: 0 };
          const currentPrice = priceInfo.usd;
          const priceChange24h = priceInfo.usd_24h_change || 0;
          
          const assetValue = Number(asset.balance) * currentPrice;
          totalValue += assetValue;
          
          // Calculate previous value 24h ago
          const previousPrice = currentPrice / (1 + (priceChange24h / 100));
          previousValue += Number(asset.balance) * previousPrice;
        });
        
        const change24h = totalValue - previousValue;
        const change24hPercentage = previousValue > 0 ? (change24h / previousValue) * 100 : 0;
        
        res.json({
          totalValue,
          change24h,
          change24hPercentage,
          lastUpdated: new Date().toISOString()
        });
      } catch (priceError) {
        console.error("Error fetching price data for overview:", priceError);
        res.status(500).json({
          message: "Failed to fetch price data for portfolio overview",
          error: priceError instanceof Error ? priceError.message : String(priceError),
        });
      }
    } catch (error) {
      console.error(`Error generating overview for portfolio ${req.params.id}:`, error);
      res.status(500).json({
        message: "Failed to generate portfolio overview",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
