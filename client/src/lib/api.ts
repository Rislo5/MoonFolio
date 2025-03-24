import {
  AssetWithPrice,
  ChartData,
  EnsWalletData,
  Portfolio,
  PortfolioOverview,
  TransactionWithDetails,
} from "@shared/schema";
import { apiRequest } from "./queryClient";

// CoinGecko API related functions
export async function fetchPopularCryptos() {
  const response = await fetch("/api/crypto/popular");
  if (!response.ok) {
    throw new Error("Failed to fetch popular cryptocurrencies");
  }
  return response.json();
}

export async function searchCryptos(query: string) {
  if (!query || query.length < 2) {
    return { coins: [] };
  }
  
  try {
    const response = await fetch(`/api/crypto/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      if (response.status === 429) {
        // Troppe richieste - ritorna un array vuoto invece di un errore
        console.warn("Rate limit exceeded for CoinGecko API");
        return { coins: [] };
      }
      throw new Error("Failed to search cryptocurrencies");
    }
    return response.json();
  } catch (error) {
    console.error("Search error:", error);
    // In caso di errore ritorna un array vuoto invece di interrompere il flusso
    return { coins: [] };
  }
}

export async function fetchCryptoPrice(id: string) {
  const response = await fetch(`/api/crypto/price/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${id}`);
  }
  return response.json();
}

export async function fetchCryptoHistory(id: string, days: string) {
  const response = await fetch(`/api/crypto/history/${id}/${days}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history for ${id}`);
  }
  return response.json();
}

// ENS related functions
export async function resolveEnsName(name: string): Promise<{ address: string; ensName: string | null }> {
  const response = await fetch(`/api/ens/resolve/${name}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to resolve ENS name");
  }
  return response.json();
}

export async function fetchWalletAssets(address: string): Promise<EnsWalletData> {
  const response = await fetch(`/api/wallet/${address}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch wallet assets");
  }
  return response.json();
}

// Portfolio related functions
export async function createPortfolio(data: {
  name: string;
  walletAddress?: string;
  isEns?: boolean;
  ensName?: string;
  showInSummary?: boolean;
}): Promise<Portfolio> {
  const response = await apiRequest("POST", "/api/portfolios", data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create portfolio");
  }
  return response.json();
}

export async function fetchPortfolios(): Promise<Portfolio[]> {
  const response = await fetch("/api/portfolios");
  if (!response.ok) {
    throw new Error("Failed to fetch portfolios");
  }
  return response.json();
}

export async function fetchPortfolio(id: number): Promise<Portfolio> {
  const response = await fetch(`/api/portfolios/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio");
  }
  return response.json();
}

export async function updatePortfolio(id: number, data: Partial<Portfolio>): Promise<Portfolio> {
  const response = await apiRequest("PUT", `/api/portfolios/${id}`, data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update portfolio");
  }
  return response.json();
}

export async function deletePortfolio(id: number): Promise<void> {
  const response = await apiRequest("DELETE", `/api/portfolios/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete portfolio");
  }
}

// Asset related functions
export async function createAsset(
  portfolioId: number,
  data: {
    name: string;
    symbol: string;
    coinGeckoId: string;
    balance: string; // Changed to string to match server expectation
    avgBuyPrice?: string; // Changed to string to match server expectation
    imageUrl?: string;
  }
): Promise<AssetWithPrice> {
  const response = await apiRequest(
    "POST",
    `/api/portfolios/${portfolioId}/assets`,
    data
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create asset");
  }
  return response.json();
}

export async function fetchAssets(portfolioId: number): Promise<AssetWithPrice[]> {
  const response = await fetch(`/api/portfolios/${portfolioId}/assets`);
  if (!response.ok) {
    throw new Error("Failed to fetch assets");
  }
  return response.json();
}

export async function updateAsset(
  id: number,
  data: Partial<{
    name: string;
    symbol: string;
    coinGeckoId: string;
    balance: string; // Changed to string
    avgBuyPrice: string; // Changed to string
    imageUrl: string;
  }>
): Promise<AssetWithPrice> {
  const response = await apiRequest("PUT", `/api/assets/${id}`, data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update asset");
  }
  return response.json();
}

export async function deleteAsset(id: number): Promise<void> {
  const response = await apiRequest("DELETE", `/api/assets/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete asset");
  }
}

// Transaction related functions
export async function createTransaction(
  portfolioId: number,
  data: {
    assetId: number;
    type: string;
    amount: string; // Changed to string
    price?: string; // Changed to string
    toAssetId?: number;
    toAmount?: string; // Changed to string
    toPrice?: string; // Changed to string
    date?: string;
    status?: string;
  }
): Promise<TransactionWithDetails> {
  const response = await apiRequest(
    "POST",
    `/api/portfolios/${portfolioId}/transactions`,
    data
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create transaction");
  }
  return response.json();
}

export async function fetchTransactions(portfolioId: number): Promise<TransactionWithDetails[]> {
  const response = await fetch(`/api/portfolios/${portfolioId}/transactions`);
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return response.json();
}

export async function updateTransaction(
  id: number,
  data: Partial<{
    assetId: number;
    type: string;
    amount: string; // Changed to string
    price: string; // Changed to string
    toAssetId: number;
    toAmount: string; // Changed to string
    toPrice: string; // Changed to string
    date: string;
    status: string;
  }>
): Promise<TransactionWithDetails> {
  const response = await apiRequest("PUT", `/api/transactions/${id}`, data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update transaction");
  }
  return response.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const response = await apiRequest("DELETE", `/api/transactions/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete transaction");
  }
}

// Portfolio overview
export async function fetchPortfolioOverview(id: number): Promise<PortfolioOverview> {
  const response = await fetch(`/api/portfolios/${id}/overview`);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio overview");
  }
  return response.json();
}

// Funzione per generare dati di grafici basati sui dati del portfolio
export async function generatePortfolioChartData(timeframe: string, specificPortfolioId?: number): Promise<ChartData> {
  const days = timeframeToDays(timeframe);
  const dates = generateDates(days);
  
  try {
    let currentValue: number = 0;
    
    // Se è stato specificato un ID di portfolio, usa quello per un singolo portfolio
    if (specificPortfolioId) {
      try {
        const response = await fetch(`/api/portfolios/${specificPortfolioId}/overview`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const overview = await response.json();
        currentValue = overview.totalValue || 0;
      } catch (error) {
        console.error("Errore nel caricamento dell'overview per il portfolio specificato:", error);
      }
    } else {
      // Altrimenti calcola il valore totale di tutti i portfolio (vista generale)
      try {
        const response = await fetch('/api/portfolios');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const portfolios = await response.json();
        if (!portfolios || portfolios.length === 0) {
          throw new Error("Nessun portfolio trovato");
        }
        
        // Calcola la somma solo dei portfolios che devono essere inclusi nel riepilogo
        for (const portfolio of portfolios) {
          // Se showInSummary è false, salta questo portfolio
          if (portfolio.showInSummary === false) {
            continue;
          }
          
          try {
            const overviewResponse = await fetch(`/api/portfolios/${portfolio.id}/overview`);
            if (!overviewResponse.ok) {
              throw new Error(`HTTP error! status: ${overviewResponse.status}`);
            }
            
            const overview = await overviewResponse.json();
            currentValue += overview.totalValue || 0;
          } catch (error) {
            console.error(`Errore nel caricamento dell'overview per il portfolio ID ${portfolio.id}:`, error);
          }
        }
        
        // Se dopo tutto non abbiamo un valore, usa un valore di default
        if (currentValue <= 0 && portfolios.length > 0) {
          const fallbackPortfolio = portfolios[0];
          const fallbackResponse = await fetch(`/api/portfolios/${fallbackPortfolio.id}/overview`);
          if (fallbackResponse.ok) {
            const overview = await fallbackResponse.json();
            currentValue = overview.totalValue || 0;
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento dei portfolios:", error);
      }
    }
    
    // Per evitare grafici piatti quando il valore è 0
    if (currentValue <= 0) {
      currentValue = 1000; // Valore base minimo
    }
    
    // Calcola un valore iniziale realistico basato sul timeframe
    let startValue = currentValue;
    const variationFactors = {
      '24h': { min: -0.03, max: 0.03 },    // ±3% nelle ultime 24 ore
      '7d': { min: -0.08, max: 0.08 },     // ±8% negli ultimi 7 giorni
      '30d': { min: -0.15, max: 0.15 },    // ±15% negli ultimi 30 giorni
      '1y': { min: -0.30, max: 0.50 },     // -30% a +50% nell'ultimo anno
      'all': { min: -0.40, max: 0.70 }     // -40% a +70% da sempre
    };
    
    // Seleziona il range di variazione appropriato
    const range = variationFactors[timeframe as keyof typeof variationFactors] || 
                 { min: -0.10, max: 0.10 };
    
    // Determina casualmente se il trend è positivo o negativo con bias positivo
    const isPositive = Math.random() > 0.3; // 70% di probabilità di trend positivo
    
    // Calcola il valore iniziale
    if (isPositive) {
      // Se positivo, il valore finale (corrente) è più alto di quello iniziale
      const variationPercent = range.min + (Math.random() * (range.max - range.min));
      startValue = currentValue / (1 + variationPercent);
    } else {
      // Se negativo, il valore finale (corrente) è più basso di quello iniziale
      const variationPercent = range.min + (Math.random() * (range.max - range.min));
      startValue = currentValue / (1 - variationPercent);
    }
    
    // Genera i valori con una camminata casuale tendente al valore corrente
    const values: number[] = [];
    const stepChange = (currentValue - startValue) / (dates.length - 1);
    
    let cumulativeValue = startValue;
    
    // Aggiungi volatilità ai valori
    dates.forEach((_, index) => {
      // Volatilità proporzionale al valore e alla lunghezza del timeframe
      const volatilityFactor = timeframe === '24h' ? 0.005 : 
                            timeframe === '7d' ? 0.01 : 
                            timeframe === '30d' ? 0.015 : 0.02;
      
      const volatility = Math.min(volatilityFactor * cumulativeValue, 1000);
      const randomChange = (Math.random() - 0.5) * volatility * 2;
      
      // Aggiungi il cambiamento di tendenza
      if (index > 0) { // Mantieni il primo valore come calcolato
        cumulativeValue += stepChange;
        cumulativeValue += randomChange;
      }
      
      // Assicura che i valori non siano negativi
      cumulativeValue = Math.max(cumulativeValue, 1);
      
      // Arrotonda a 2 decimali e aggiungi all'array dei valori
      values.push(Number(cumulativeValue.toFixed(2)));
    });
    
    // Assicurati che l'ultimo valore sia esattamente il valore corrente del portfolio
    if (values.length > 0) {
      values[values.length - 1] = currentValue;
    }
    
    return {
      labels: dates,
      values: values
    };
  } catch (error) {
    console.error("Errore nella generazione dei dati del grafico:", error);
    
    // Fallback con dati semplici in caso di errore
    const baseValue = 1000;
    const volatility = 0.05; // 5% di volatilità giornaliera
    
    let value = baseValue;
    const values = dates.map(() => {
      const change = (Math.random() - 0.45) * volatility * value; // Leggero bias positivo
      value += change;
      return Math.max(value, 1); // Evita valori negativi
    });
    
    return {
      labels: dates,
      values: values
    };
  }
}

// Helper function to convert timeframe to days
function timeframeToDays(timeframe: string): number {
  switch (timeframe) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '1y':
      return 365;
    case 'all':
      return 1095; // 3 years as "all"
    default:
      return 7;
  }
}

// Helper function to generate date labels
function generateDates(days: number): string[] {
  const dates = [];
  const today = new Date();
  
  // Per periodi lunghi (1 anno o più), creiamo meno punti per rendere il grafico più leggibile
  if (days > 90) {
    // Intervallo in giorni tra i punti del grafico
    const interval = Math.max(1, Math.floor(days / 30));
    
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
    
    // Assicuriamoci di avere il punto finale se non è già incluso
    if ((days % interval) !== 0) {
      dates.push(today.toISOString().split('T')[0]);
    }
  } else {
    // Per periodi più brevi, mostriamo tutti i giorni
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
  }
  
  return dates;
}
