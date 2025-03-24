import { ethers } from 'ethers';
import fetch from 'node-fetch';

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;

// ABI standard per token ERC20
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

// Elenco di token ERC20 comuni con i loro indirizzi
const COMMON_TOKENS = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    coinGeckoId: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    coinGeckoId: 'usd-coin',
    logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    coinGeckoId: 'tether',
    logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    coinGeckoId: 'bitcoin',
    logoUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png'
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    coinGeckoId: 'dai',
    logoUrl: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
  },
  {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    name: 'ChainLink Token',
    symbol: 'LINK',
    decimals: 18,
    coinGeckoId: 'chainlink',
    logoUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    coinGeckoId: 'uniswap',
    logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png'
  },
  {
    address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    coinGeckoId: 'matic-network',
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
  }
];

// Provider Ethereum utilizzando Infura
const provider = new ethers.JsonRpcProvider(INFURA_URL);

/**
 * Servizio per interagire con la blockchain Ethereum
 */
export class EthereumService {
  /**
   * Risolve un nome ENS in un indirizzo Ethereum
   * @param ensName Nome ENS (es. "vitalik.eth")
   * @returns Indirizzo Ethereum risolto
   */
  async resolveEnsName(ensName: string): Promise<{ address: string; ensName: string | null }> {
    try {
      // Verifica se è già un indirizzo Ethereum
      if (ethers.isAddress(ensName)) {
        return { address: ensName, ensName: null };
      }

      // Verifica validità nome ENS
      if (typeof ensName === 'string' && !ensName.endsWith('.eth')) {
        throw new Error('Nome ENS non valido');
      }

      // Risolvi il nome ENS in un indirizzo
      const address = await provider.resolveName(ensName);
      
      if (!address) {
        throw new Error('Nome ENS non trovato');
      }

      return { address, ensName };
    } catch (error) {
      console.error(`Errore nella risoluzione del nome ENS ${ensName}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene il saldo di ETH per un indirizzo
   * @param address Indirizzo Ethereum
   * @returns Saldo in ETH
   */
  async getEthBalance(address: string): Promise<number> {
    try {
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error(`Errore nell'ottenere il saldo ETH per ${address}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene il saldo di un token ERC20 per un indirizzo
   * @param tokenAddress Indirizzo del contratto del token
   * @param ownerAddress Indirizzo del proprietario
   * @returns Saldo formattato
   */
  async getTokenBalance(tokenAddress: string, ownerAddress: string): Promise<{ 
    balance: number; 
    name: string; 
    symbol: string; 
    decimals: number;
  }> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [balance, name, symbol, decimals] = await Promise.all([
        tokenContract.balanceOf(ownerAddress),
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);

      const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
      
      return {
        balance: formattedBalance,
        name,
        symbol,
        decimals
      };
    } catch (error) {
      console.error(`Errore nell'ottenere il saldo del token ${tokenAddress} per ${ownerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene tutti i saldi dei token ERC20 comunemente utilizzati per un indirizzo
   * @param address Indirizzo Ethereum
   * @returns Array di token con i rispettivi saldi
   */
  async getCommonTokenBalances(address: string): Promise<any[]> {
    try {
      const balancePromises = COMMON_TOKENS.map(async (token) => {
        try {
          const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const balance = await tokenContract.balanceOf(address);
          const formattedBalance = parseFloat(ethers.formatUnits(balance, token.decimals));
          
          // Restituisce solo token con saldo > 0
          if (formattedBalance > 0) {
            return {
              name: token.name,
              symbol: token.symbol,
              coinGeckoId: token.coinGeckoId,
              balance: formattedBalance,
              imageUrl: token.logoUrl
            };
          }
          return null;
        } catch (error) {
          console.error(`Errore nell'ottenere il saldo del token ${token.symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(balancePromises);
      
      // Filtra i risultati nulli (token con saldo 0 o errori)
      return results.filter(result => result !== null);
    } catch (error) {
      console.error(`Errore nell'ottenere i saldi dei token per ${address}:`, error);
      throw error;
    }
  }

  /**
   * Ottiene tutti gli asset di un wallet (ETH e token ERC20 comuni)
   * @param address Indirizzo Ethereum
   * @returns Dati del wallet con tutti gli asset
   */
  async getWalletAssets(address: string): Promise<{ 
    address: string; 
    ensName?: string;
    assets: any[];
  }> {
    try {
      // Ottiene il saldo di ETH
      const ethBalance = await this.getEthBalance(address);
      
      // Ottiene i saldi dei token ERC20 comuni
      const tokenBalances = await this.getCommonTokenBalances(address);
      
      // Crea un array di tutti gli asset (ETH + token ERC20)
      const assets = [
        {
          name: "Ethereum",
          symbol: "ETH",
          coinGeckoId: "ethereum",
          balance: ethBalance,
          imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
        },
        ...tokenBalances
      ].filter(asset => asset.balance > 0); // Filtra solo asset con saldo > 0
      
      return {
        address,
        assets
      };
    } catch (error) {
      console.error(`Errore nell'ottenere gli asset del wallet ${address}:`, error);
      throw error;
    }
  }
}

// Esporta un'istanza del servizio
export const ethereumService = new EthereumService();