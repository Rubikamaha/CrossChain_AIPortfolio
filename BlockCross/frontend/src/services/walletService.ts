import { ethers } from "ethers";

/**
 * Service to connect to MetaMask and fetch basic wallet info
 */
export const walletService = {
  /**
   * Connect to MetaMask and get the signer/address
   */
  async connect() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    
    const provider = new ethers.BrowserProvider(window.ethereum as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return { provider, signer, address };
  },

  /**
   * Get the current connected wallet address
   */
  async getWalletAddress() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  },

  /**
   * Get native ETH balance
   */
  async getETHBalance(address: string) {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balance));
  },

  /**
   * Get ERC20 token balance (USDC, etc.)
   */
  async getERC20Balance(address: string, tokenAddress: string) {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    
    const abi = ["function balance(address) view returns (uint256)", "function decimals() view returns (uint8)"];
    // Note: Standard ERC20 uses 'balanceOf', but sometimes 'balance' is used in specific scripts. 
    // Standardizing on 'balanceOf' for robust detection.
    const standardAbi = ["function balanceOf(address account) view returns (uint256)", "function decimals() view returns (uint8)"];
    
    const contract = new ethers.Contract(tokenAddress, standardAbi, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals()
    ]);
    
    return parseFloat(ethers.formatUnits(balance, decimals));
  }
};
