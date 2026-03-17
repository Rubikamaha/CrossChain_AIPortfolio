import { ethers } from "ethers";

// ABI for ERC20 balance check
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  contractAddress: string;
}

/**
 * Service to fetch real on-chain balances using ethers v6
 */
export const tokenBalanceService = {
  /**
   * Fetch native and specific ERC20 balances for a wallet
   */
  async getBalances(address: string, erc20Tokens: string[] = []): Promise<Record<string, number>> {
    if (!window.ethereum) throw new Error("MetaMask not found");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const balances: Record<string, number> = {};

    try {
      // 1. Fetch Native Balance (ETH, BNB, MATIC depends on chain)
      const network = await provider.getNetwork();
      const nativeBalance = await provider.getBalance(address);
      
      // Determine symbol based on chainId (simplified)
      const chainId = Number(network.chainId);
      let nativeSymbol = "ETH";
      if (chainId === 56 || chainId === 97) nativeSymbol = "BNB";
      else if (chainId === 137 || chainId === 80002) nativeSymbol = "MATIC";

      balances[nativeSymbol] = Number(ethers.formatEther(nativeBalance));

      // 2. Fetch ERC20 Balances
      const tokenPromises = erc20Tokens.map(async (tokenAddress) => {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const [balance, decimals, symbol] = await Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.symbol()
          ]);
          
          return {
            symbol: symbol as string,
            balance: Number(balance) / Math.pow(10, Number(decimals))
          };
        } catch (err) {
          console.warn(`Failed to fetch balance for token ${tokenAddress}`, err);
          return null;
        }
      });

      const results = await Promise.all(tokenPromises);
      results.forEach(res => {
        if (res) balances[res.symbol] = res.balance;
      });

      return balances;
    } catch (error) {
      console.error("Error fetching on-chain balances:", error);
      throw error;
    }
  }
};
