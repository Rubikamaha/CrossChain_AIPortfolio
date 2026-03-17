import { useState, useEffect } from 'react';
import { tokenBalanceService } from '@/services/tokenBalanceService';
import { NETWORKS, NETWORK_MODE } from '@/config/networkConfig';
import { ethers } from 'ethers';

export function useRealBalances(address: string | null) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!window.ethereum) throw new Error("MetaMask not connected");
      
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      const config = NETWORKS[NETWORK_MODE][chainId];
      const erc20s = config ? [config.usdc] : [];
      
      const data = await tokenBalanceService.getBalances(address, erc20s);
      setBalances(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [address]);

  return { balances, isLoading, error, refresh: fetchBalances };
}
