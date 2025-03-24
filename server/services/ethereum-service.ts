import { ethers } from 'ethers';
import fetch from 'node-fetch';

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;

// Check if Infura API key is configured
if (!INFURA_API_KEY) {
  console.warn("WARNING: INFURA_API_KEY is not configured. Ethereum functionality will not work correctly.");
}

// Test Infura connection
async function testInfuraConnection() {
  try {
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const network = await provider.getNetwork();
    console.log(`Successfully connected to Ethereum network: ${network.name} (chainId: ${network.chainId})`);
    return true;
  } catch (error) {
    console.error("ERROR: Failed to connect to Infura:", error);
    console.error("Please check your INFURA_API_KEY configuration.");
    return false;
  }
}

// Test connection on startup
testInfuraConnection();

// Standard ABI for ERC20 tokens
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

// List of common ERC20 tokens with their addresses
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

// Create Ethereum provider using Infura
let provider: ethers.JsonRpcProvider;
try {
  provider = new ethers.JsonRpcProvider(INFURA_URL);
} catch (error) {
  console.error("Failed to create Ethereum provider:", error);
  // Create a fallback provider that will properly error when used
  provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/invalid-key");
}

/**
 * Service for interacting with the Ethereum blockchain
 */
export class EthereumService {
  /**
   * Resolves an ENS name to an Ethereum address
   * @param ensName ENS name (e.g. "vitalik.eth")
   * @returns Resolved Ethereum address
   */
  async resolveEnsName(ensName: string): Promise<{ address: string; ensName: string | null }> {
    try {
      // Check if it's already an Ethereum address
      if (ethers.isAddress(ensName)) {
        return { address: ensName, ensName: null };
      }

      // Validate ENS name format
      if (!ensName || typeof ensName !== 'string') {
        throw new Error('The ensName parameter must be a string');
      }
      
      if (!ensName.endsWith('.eth')) {
        throw new Error('Invalid ENS name. Must end with .eth');
      }

      console.log(`Attempting to resolve ENS name: ${ensName} using Infura`);
      
      // Resolve the ENS name to an address
      const address = await provider.resolveName(ensName);
      
      if (!address) {
        throw new Error('ENS name not found');
      }

      console.log(`Successfully resolved ENS name ${ensName} to address ${address}`);
      return { address, ensName };
    } catch (error: any) {
      console.error(`Error resolving ENS name ${ensName}:`, error);
      
      // Enhance error reporting
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && error.message.includes('DOCTYPE')) {
        throw new Error('Invalid response from Infura API. Please check your INFURA_API_KEY configuration.');
      }
      
      throw error;
    }
  }

  /**
   * Gets the ETH balance for an address
   * @param address Ethereum address
   * @returns Balance in ETH
   */
  async getEthBalance(address: string): Promise<number> {
    try {
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error(`Error getting ETH balance for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Gets the balance of an ERC20 token for an address
   * @param tokenAddress Contract address of the token
   * @param ownerAddress Owner address
   * @returns Formatted balance
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
      console.error(`Error getting token balance for ${tokenAddress} (owner: ${ownerAddress}):`, error);
      throw error;
    }
  }

  /**
   * Gets all balances of commonly used ERC20 tokens for an address
   * @param address Ethereum address
   * @returns Array of tokens with their balances
   */
  async getCommonTokenBalances(address: string): Promise<any[]> {
    try {
      const balancePromises = COMMON_TOKENS.map(async (token) => {
        try {
          const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const balance = await tokenContract.balanceOf(address);
          const formattedBalance = parseFloat(ethers.formatUnits(balance, token.decimals));
          
          // Return all tokens, even with zero balance
          return {
            name: token.name,
            symbol: token.symbol,
            coinGeckoId: token.coinGeckoId,
            balance: formattedBalance,
            imageUrl: token.logoUrl
          };
        } catch (error) {
          console.error(`Error getting balance for token ${token.symbol}:`, error);
          // Return the token with zero balance in case of error
          return {
            name: token.name,
            symbol: token.symbol,
            coinGeckoId: token.coinGeckoId,
            balance: 0,
            imageUrl: token.logoUrl
          };
        }
      });

      const results = await Promise.all(balancePromises);
      
      // Return all results, including those with zero balance
      return results;
    } catch (error) {
      console.error(`Error getting token balances for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Gets all assets of a wallet (ETH and common ERC20 tokens)
   * @param address Ethereum address
   * @returns Wallet data with all assets
   */
  async getWalletAssets(address: string): Promise<{ 
    address: string; 
    ensName?: string;
    assets: any[];
  }> {
    try {
      console.log(`Getting wallet assets for address: ${address}`);
      
      // Get ETH balance
      const ethBalance = await this.getEthBalance(address);
      console.log(`ETH balance for ${address}: ${ethBalance}`);
      
      // Get balances of ERC20 tokens
      const tokenBalances = await this.getCommonTokenBalances(address);
      const tokensWithBalance = tokenBalances.filter(token => token.balance > 0);
      console.log(`Found ${tokensWithBalance.length} ERC20 tokens with non-zero balance for ${address} (displaying all ${tokenBalances.length} supported tokens)`);
      
      // Create array of all assets (ETH + ERC20 tokens) without filtering zero balances
      const assets = [
        {
          name: "Ethereum",
          symbol: "ETH",
          coinGeckoId: "ethereum",
          balance: ethBalance,
          imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
        },
        ...tokenBalances
      ];
      
      return {
        address,
        assets
      };
    } catch (error: any) {
      console.error(`Error getting wallet assets for ${address}:`, error);
      
      // Enhance error reporting
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && error.message.includes('DOCTYPE')) {
        throw new Error('Invalid response from Infura API. Please check your INFURA_API_KEY configuration.');
      }
      
      throw error;
    }
  }
}

// Export an instance of the service
export const ethereumService = new EthereumService();