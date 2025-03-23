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
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

// API URLs
const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
const COINMARKETCAP_API_URL = "https://pro-api.coinmarketcap.com/v1";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Get popular cryptocurrencies with their current prices
  app.get("/api/crypto/popular", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(
        `${COINMARKETCAP_API_URL}/cryptocurrency/listings/latest?limit=50&convert=USD`, {
          headers: {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the data to match the CoinGecko format that our frontend expects
      const transformedData = data.data.map((coin: any) => ({
        id: coin.slug,
        symbol: coin.symbol.toLowerCase(),
        name: coin.name,
        image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
        current_price: coin.quote.USD.price,
        price_change_percentage_24h: coin.quote.USD.percent_change_24h,
        market_cap: coin.quote.USD.market_cap,
        market_cap_rank: coin.cmc_rank
      }));
      
      res.json(transformedData);
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
      
      try {
        // First get all coins from CoinMarketCap (no direct search endpoint)
        const response = await fetch(
          `${COINMARKETCAP_API_URL}/cryptocurrency/listings/latest?limit=5000&convert=USD`, {
            headers: {
              'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`CoinMarketCap API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filter coins that match the query in name or symbol
        const filteredCoins = data.data.filter((coin: any) => {
          return coin.name.toLowerCase().includes(query.toLowerCase()) || 
                 coin.symbol.toLowerCase().includes(query.toLowerCase());
        });
        
        // Format the response to match the expected format in the frontend
        const enrichedCoins = filteredCoins.map((coin: any) => ({
          id: coin.slug,
          name: coin.name,
          symbol: coin.symbol.toLowerCase(),
          image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
          market_cap_rank: coin.cmc_rank
        })).slice(0, 10); // Limita a 10 risultati
        
        res.json(enrichedCoins);
      } catch (error) {
        console.error("Error searching cryptocurrencies:", error);
        
        // Basic fallback data if the API fails
        const fallbackData = [];
        if (query.toLowerCase().includes("bitcoin") || query.toLowerCase().includes("btc")) {
          fallbackData.push({
            id: "bitcoin",
            name: "Bitcoin",
            symbol: "btc",
            image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
            market_cap_rank: 1
          });
        }
        if (query.toLowerCase().includes("ethereum") || query.toLowerCase().includes("eth")) {
          fallbackData.push({
            id: "ethereum",
            name: "Ethereum",
            symbol: "eth",
            image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
            market_cap_rank: 2
          });
        }
        if (query.toLowerCase().includes("tether") || query.toLowerCase().includes("usdt")) {
          fallbackData.push({
            id: "tether",
            name: "Tether",
            symbol: "usdt",
            image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
            market_cap_rank: 3
          });
        }
        
        res.json(fallbackData);
      }
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
      
      // Get cryptocurrency quotes from CoinMarketCap
      const response = await fetch(
        `${COINMARKETCAP_API_URL}/cryptocurrency/quotes/latest?slug=${id}`, {
          headers: {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the coin info from the response
      const coinId = Object.keys(data.data)[0];
      const coinData = data.data[coinId];
      
      if (!coinData) {
        return res.status(404).json({ message: "Cryptocurrency not found" });
      }
      
      // Transform to match the format expected by the frontend (CoinGecko format)
      const transformedData = {
        [id]: {
          usd: coinData.quote.USD.price,
          usd_24h_change: coinData.quote.USD.percent_change_24h
        }
      };
      
      res.json(transformedData);
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
      const interval = Number(days) <= 1 ? '1h' : Number(days) <= 7 ? '1d' : '1d';
      
      // CoinMarketCap doesn't have a specific endpoint for price history that matches the exact
      // format of CoinGecko, so we'll create simulated data based on current price with some variation
      // In a production app, you would use a different API or service that provides historical data
      
      // First get the current price
      const currentPriceResponse = await fetch(
        `${COINMARKETCAP_API_URL}/cryptocurrency/quotes/latest?slug=${id}`, {
          headers: {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            'Accept': 'application/json'
          }
        }
      );
      
      if (!currentPriceResponse.ok) {
        throw new Error(`CoinMarketCap API error: ${currentPriceResponse.statusText}`);
      }
      
      const priceData = await currentPriceResponse.json();
      const coinId = Object.keys(priceData.data)[0];
      const coinData = priceData.data[coinId];
      
      if (!coinData) {
        return res.status(404).json({ message: "Cryptocurrency not found" });
      }
      
      const currentPrice = coinData.quote.USD.price;
      const change24h = coinData.quote.USD.percent_change_24h / 100;
      const change7d = coinData.quote.USD.percent_change_7d / 100;
      const change30d = coinData.quote.USD.percent_change_30d / 100;
      
      // Generate data points
      const now = Date.now();
      const daysMs = Number(days) * 24 * 60 * 60 * 1000;
      const startTime = now - daysMs;
      const dataPoints = [];
      
      // Generate enough data points based on the interval
      const pointCount = Number(days) <= 1 ? 24 : // hourly for 1 day
                        Number(days) <= 7 ? days * 24 : // hourly for up to 7 days
                        Number(days); // daily for longer periods
                        
      const pointInterval = daysMs / pointCount;
      
      // Calculate fluctuation factor based on time period
      let fluctuationFactor;
      if (Number(days) <= 1) {
        fluctuationFactor = change24h / 24; // Hourly fluctuation for 1 day
      } else if (Number(days) <= 7) {
        fluctuationFactor = change7d / 7; // Daily fluctuation for 7 days
      } else if (Number(days) <= 30) {
        fluctuationFactor = change30d / 30; // Daily fluctuation for 30 days
      } else {
        fluctuationFactor = change30d / 30; // Use monthly for longer periods
      }
      
      // Generate price points with realistic fluctuation
      for (let i = 0; i < pointCount; i++) {
        const pointTime = startTime + (i * pointInterval);
        const timeFactor = i / pointCount;
        const trendFactor = Number(days) <= 1 ? change24h :
                          Number(days) <= 7 ? change7d :
                          change30d;
        
        // Calculate price based on current price and apply trend + random noise
        let pointPrice = currentPrice / (1 + trendFactor);
        pointPrice += pointPrice * trendFactor * timeFactor;
        
        // Add some random noise to make it look more realistic
        const noise = (Math.random() - 0.5) * Math.abs(fluctuationFactor) * 2;
        pointPrice *= (1 + noise);
        
        dataPoints.push([pointTime, pointPrice]);
      }
      
      // Add current price at the end
      dataPoints.push([now, currentPrice]);
      
      // Format response to match CoinGecko format
      const response = {
        prices: dataPoints,
        market_caps: dataPoints.map(([time]) => [time, coinData.quote.USD.market_cap]),
        total_volumes: dataPoints.map(([time]) => [time, coinData.quote.USD.volume_24h])
      };
      
      res.json(response);
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
