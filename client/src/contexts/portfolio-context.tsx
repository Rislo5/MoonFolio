import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Portfolio,
  AssetWithPrice,
  TransactionWithDetails,
  PortfolioOverview,
  EnsWalletData,
  ChartData,
  TimeFrame,
} from "@shared/schema";
import {
  createPortfolio,
  createAsset,
  createTransaction,
  fetchPortfolios,
  fetchAssets,
  fetchTransactions,
  fetchPortfolioOverview,
  updateAsset,
  updateTransaction,
  deleteAsset,
  deleteTransaction,
  deletePortfolio,
  resolveEnsName,
  fetchWalletAssets,
  generatePortfolioChartData,
} from "@/lib/api";

type PortfolioContextType = {
  activePortfolio: Portfolio | null;
  portfolios: Portfolio[];
  assets: AssetWithPrice[];
  transactions: TransactionWithDetails[];
  portfolioOverview: PortfolioOverview | null;
  portfolioChartData: ChartData | null;
  isConnected: boolean;
  isLoading: boolean;
  activeTimeframe: TimeFrame;
  
  // Portfolio actions
  connectEnsWallet: (ensNameOrAddress: string) => Promise<void>;
  createManualPortfolio: (name: string) => Promise<Portfolio>;
  setActivePortfolio: (portfolioId: number) => void;
  disconnect: () => void;
  deletePortfolio: (portfolioId: number) => Promise<void>;
  
  // Asset actions
  addAsset: (asset: {
    name: string;
    symbol: string;
    coinGeckoId: string;
    balance: string;
    avgBuyPrice?: string;
    imageUrl?: string;
    portfolioId?: number;
  }) => Promise<AssetWithPrice>;
  editAsset: (assetId: number, assetData: Partial<AssetWithPrice>) => Promise<any>; // Changed to any to match actual implementation
  removeAsset: (assetId: number) => Promise<any>; // Changed to any to match actual implementation
  
  // Transaction actions
  addTransaction: (transaction: {
    assetId: number;
    type: string;
    amount: string;
    price?: string;
    toAssetId?: number;
    toAmount?: string;
    toPrice?: string;
    date?: string;
  }) => Promise<TransactionWithDetails>;
  editTransaction: (
    transactionId: number,
    transactionData: Partial<TransactionWithDetails>
  ) => Promise<any>; // Changed to any to match actual implementation
  removeTransaction: (transactionId: number) => Promise<any>; // Changed to any to match actual implementation
  
  // Chart actions
  setActiveTimeframe: (timeframe: TimeFrame) => void;
};

export const PortfolioContext = createContext<PortfolioContextType>({
  activePortfolio: null,
  portfolios: [],
  assets: [],
  transactions: [],
  portfolioOverview: null,
  portfolioChartData: null,
  isConnected: false,
  isLoading: true,
  activeTimeframe: "7d",
  
  connectEnsWallet: async () => {},
  createManualPortfolio: async () => ({
    id: 0,
    name: "",
    userId: null,
    walletAddress: null,
    isEns: null,
    ensName: null,
    createdAt: null,
    updatedAt: null,
  }),
  setActivePortfolio: () => {},
  disconnect: () => {},
  deletePortfolio: async () => {},
  
  addAsset: async () => ({} as AssetWithPrice),
  editAsset: async () => ({} as AssetWithPrice),
  removeAsset: async () => true,
  
  addTransaction: async () => ({} as TransactionWithDetails),
  editTransaction: async () => ({} as TransactionWithDetails),
  removeTransaction: async () => true,
  
  setActiveTimeframe: () => {},
});

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activePortfolioId, setActivePortfolioId] = useState<number | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>("7d");
  
  // Query for fetching all portfolios
  const portfoliosQuery = useQuery({
    queryKey: ["/api/portfolios"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const portfolios = portfoliosQuery.data as Portfolio[] || [];
  
  // Queries dependent on active portfolio
  const assetsQuery = useQuery({
    queryKey: [`/api/portfolios/${activePortfolioId}/assets`],
    enabled: !!activePortfolioId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const transactionsQuery = useQuery({
    queryKey: [`/api/portfolios/${activePortfolioId}/transactions`],
    enabled: !!activePortfolioId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const portfolioOverviewQuery = useQuery({
    queryKey: [`/api/portfolios/${activePortfolioId}/overview`],
    enabled: !!activePortfolioId,
    staleTime: 1000 * 60, // 1 minute
  });
  
  const portfolioChartQuery = useQuery({
    queryKey: [`/portfolio-chart`, activePortfolioId, activeTimeframe],
    enabled: !!activePortfolioId,
    queryFn: () => generatePortfolioChartData(activeTimeframe, activePortfolioId || undefined),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: 1000
  });
  
  const assets = assetsQuery.data as AssetWithPrice[] || [];
  const transactions = transactionsQuery.data as TransactionWithDetails[] || [];
  const portfolioOverview = portfolioOverviewQuery.data as PortfolioOverview || null;
  const portfolioChartData = portfolioChartQuery.data as ChartData || null;
  
  // The active portfolio based on the selected ID
  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || null;
  
  // Check if we're connected to a portfolio
  const isConnected = !!activePortfolio;
  
  // Loading state for the entire portfolio
  const isLoading = portfoliosQuery.isLoading || 
    (!!activePortfolioId && (
      assetsQuery.isLoading || 
      transactionsQuery.isLoading || 
      portfolioOverviewQuery.isLoading || 
      portfolioChartQuery.isLoading
    ));
  
  // Mutations
  const connectEnsWalletMutation = useMutation({
    mutationFn: async (ensNameOrAddress: string) => {
      // 1. Resolve the ENS name or address
      const { address, ensName } = await resolveEnsName(ensNameOrAddress);
      
      // 2. Check if portfolio exists for this address
      const existingPortfolio = portfolios.find(
        p => p.walletAddress?.toLowerCase() === address.toLowerCase()
      );
      
      if (existingPortfolio) {
        setActivePortfolioId(existingPortfolio.id);
        return existingPortfolio;
      }
      
      // 3. Fetch wallet assets
      const walletData = await fetchWalletAssets(address);
      
      // 4. Create a new portfolio
      const name = ensName || `Wallet ${address.substring(0, 6)}`;
      const portfolio = await createPortfolio({
        name,
        walletAddress: address,
        isEns: true,
        ensName: ensName || undefined,
      });
      
      // 5. Add assets to the portfolio
      for (const asset of walletData.assets) {
        await createAsset(portfolio.id, {
          name: asset.name,
          symbol: asset.symbol,
          coinGeckoId: asset.coinGeckoId,
          balance: asset.balance.toString(),
          imageUrl: asset.imageUrl,
        });
      }
      
      return portfolio;
    },
    onSuccess: (portfolio) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      setActivePortfolioId(portfolio.id);
      toast({
        title: "Wallet connected successfully",
        description: "Your portfolio has been loaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createManualPortfolioMutation = useMutation({
    mutationFn: async (name: string) => {
      const portfolio = await createPortfolio({ name });
      return portfolio;
    },
    onSuccess: (portfolio) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      setActivePortfolioId(portfolio.id);
      toast({
        title: "Portfolio created successfully",
        description: "You can now add assets to your portfolio.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create portfolio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addAssetMutation = useMutation({
    mutationFn: async (asset: {
      name: string;
      symbol: string;
      coinGeckoId: string;
      balance: string; // Changed to string
      avgBuyPrice?: string; // Changed to string
      imageUrl?: string;
    }) => {
      if (!activePortfolioId) throw new Error("No active portfolio");
      return createAsset(activePortfolioId, asset);
    },
    onSuccess: () => {
      invalidatePortfolioData();
      toast({
        title: "Asset added successfully",
        description: "Your portfolio has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const editAssetMutation = useMutation({
    mutationFn: async ({ assetId, assetData }: { assetId: number, assetData: Partial<AssetWithPrice> }) => {
      // Sanitizziamo completamente i dati null → undefined
      const sanitizedData = {
        ...assetData,
        avgBuyPrice: assetData.avgBuyPrice === null ? undefined : assetData.avgBuyPrice,
        imageUrl: assetData.imageUrl === null ? undefined : assetData.imageUrl,
        balance: assetData.balance?.toString(),  // Assicuriamoci che balance sia string
      };
      return updateAsset(assetId, sanitizedData as any);  // Use any to bypass TypeScript errors
    },
    onSuccess: () => {
      invalidatePortfolioData();
      toast({
        title: "Asset updated successfully",
        description: "Your portfolio has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const removeAssetMutation = useMutation({
    mutationFn: async (assetId: number) => {
      return deleteAsset(assetId);
    },
    onSuccess: () => {
      invalidatePortfolioData();
      toast({
        title: "Asset removed successfully",
        description: "Your portfolio has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: {
      assetId: number;
      type: string;
      amount: string;
      price?: string;
      toAssetId?: number;
      toAmount?: string;
      toPrice?: string;
      date?: string;
    }) => {
      if (!activePortfolioId) throw new Error("No active portfolio");
      return createTransaction(activePortfolioId, transaction);
    },
    onSuccess: () => {
      invalidatePortfolioData();
      toast({
        title: "Transaction added successfully",
        description: "Your portfolio has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const editTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, transactionData }: { 
      transactionId: number, 
      transactionData: Partial<TransactionWithDetails> 
    }) => {
      // Sanitizziamo i dati per gestire null values
      const sanitizedData = {
        ...transactionData,
        price: transactionData.price === null ? undefined : transactionData.price,
        toPrice: transactionData.toPrice === null ? undefined : transactionData.toPrice,
        toAssetId: transactionData.toAssetId === null ? undefined : transactionData.toAssetId,
        amount: transactionData.amount?.toString(),
        toAmount: transactionData.toAmount === null ? undefined : transactionData.toAmount?.toString(),
      };
      return updateTransaction(transactionId, sanitizedData as any);
    },
    onSuccess: () => {
      invalidatePortfolioData();
      toast({
        title: "Transaction updated successfully",
        description: "Your portfolio has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const removeTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      return deleteTransaction(transactionId);
    },
    onSuccess: () => {
      invalidatePortfolioData();
      toast({
        title: "Transaction removed successfully",
        description: "Your portfolio has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: number) => {
      return deletePortfolio(portfolioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      setActivePortfolioId(null);
      toast({
        title: "Portfolio deleted successfully",
        description: "Your portfolio has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete portfolio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper function to invalidate portfolio related data
  const invalidatePortfolioData = () => {
    if (!activePortfolioId) return;
    
    queryClient.invalidateQueries({ 
      queryKey: [`/api/portfolios/${activePortfolioId}/assets`] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/portfolios/${activePortfolioId}/transactions`] 
    });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/portfolios/${activePortfolioId}/overview`] 
    });
    queryClient.invalidateQueries({
      queryKey: [`/portfolio-chart`, activePortfolioId, activeTimeframe]
    });
  };
  
  // Check for active portfolio in localStorage on initial load
  useEffect(() => {
    const storedPortfolioId = localStorage.getItem("activePortfolioId");
    if (storedPortfolioId) {
      setActivePortfolioId(parseInt(storedPortfolioId));
    }
  }, []);
  
  // Save active portfolio to localStorage when it changes
  useEffect(() => {
    if (activePortfolioId) {
      localStorage.setItem("activePortfolioId", activePortfolioId.toString());
    } else {
      localStorage.removeItem("activePortfolioId");
    }
  }, [activePortfolioId]);
  
  return (
    <PortfolioContext.Provider
      value={{
        activePortfolio,
        portfolios,
        assets,
        transactions,
        portfolioOverview,
        portfolioChartData,
        isConnected,
        isLoading,
        activeTimeframe,
        
        connectEnsWallet: (ensNameOrAddress) => connectEnsWalletMutation.mutateAsync(ensNameOrAddress),
        createManualPortfolio: (name) => createManualPortfolioMutation.mutateAsync(name),
        setActivePortfolio: (portfolioId) => setActivePortfolioId(portfolioId),
        disconnect: () => {
          setActivePortfolioId(null);
          localStorage.removeItem("activePortfolioId");
        },
        deletePortfolio: (portfolioId) => deletePortfolioMutation.mutateAsync(portfolioId),
        
        addAsset: (asset) => addAssetMutation.mutateAsync(asset),
        editAsset: (assetId, assetData) => editAssetMutation.mutateAsync({ assetId, assetData }),
        removeAsset: (assetId) => removeAssetMutation.mutateAsync(assetId),
        
        addTransaction: (transaction) => addTransactionMutation.mutateAsync(transaction),
        editTransaction: (transactionId, transactionData) => 
          editTransactionMutation.mutateAsync({ transactionId, transactionData }),
        removeTransaction: (transactionId) => removeTransactionMutation.mutateAsync(transactionId),
        
        setActiveTimeframe,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};
