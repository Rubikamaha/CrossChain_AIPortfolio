import { useState, useEffect, useMemo } from 'react';
import { useWallet } from './useWallet';
import { walletService } from '@/services/walletService';
import { priceService } from '@/services/priceService';
import { type PortfolioData, type ChainBalance } from '@/lib/walletService';
import { NETWORKS, NETWORK_MODE } from '@/config/networkConfig';
import { ethers } from 'ethers';

export type PortfolioMode = 'DEMO' | 'LIVE';

export function usePortfolioData() {
  const { isConnected, account } = useWallet();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [mode, setMode] = useState<PortfolioMode>('DEMO');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // MOCK DATA FOR DISCONNECTED STATE (AS PER MASTER PROMPT)
    if (!isConnected || !account) {
      const mockData: PortfolioData = {
        address: "0xMockUser",
        totalValue: 4000,
        totalTokenValue: 0,
        totalNftValue: 0,
        totalNftCount: 0,
        connectedChains: 1,
        lastUpdated: new Date(),
        balances: [
          {
            chainId: 1,
            chainName: 'Ethereum',
            symbol: 'ETH',
            balance: '2',
            balanceFormatted: 2,
            usdValue: 4000,
            tokenValue: 0,
            assets: [
              { symbol: 'ETH', name: 'Ethereum', balance: 2, valueUsd: 4000, isToken: false }
            ]
          }
        ]
      };
      setData(mockData);
      setMode('DEMO');
      return;
    }

    const fetchLiveDetails = async () => {
      setIsLoading(true);
      try {
        if (!window.ethereum) throw new Error("MetaMask not found");
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const { chainId } = await provider.getNetwork();
        const cid = Number(chainId);

        // Get network config
        const networkConfig = NETWORKS[NETWORK_MODE][cid] || NETWORKS["mainnet"][1];
        const usdcAddress = networkConfig.usdc;

        const [ethBalance, usdcBalance, prices] = await Promise.all([
          walletService.getETHBalance(account),
          walletService.getERC20Balance(account, usdcAddress),
          priceService.getPrices()
        ]);

        const ethValue = ethBalance * (prices.ETH || 2000); // 2000 as fallback
        const usdcValue = usdcBalance * (prices.USDC || 1);
        const totalValue = ethValue + usdcValue;

        const activeChainBalance: ChainBalance = {
          chainId: cid,
          chainName: networkConfig.name,
          symbol: 'ETH',
          balance: ethBalance.toString(),
          balanceFormatted: ethBalance,
          usdValue: ethValue,
          tokenValue: usdcValue,
          assets: [
            {
              symbol: 'ETH',
              name: 'Ethereum',
              balance: ethBalance,
              valueUsd: ethValue,
              isToken: false
            },
            {
              symbol: 'USDC',
              name: 'USD Coin',
              balance: usdcBalance,
              valueUsd: usdcValue,
              isToken: true,
              contractAddress: usdcAddress
            }
          ]
        };

        const liveData: PortfolioData = {
          address: account,
          totalValue,
          totalTokenValue: usdcValue,
          totalNftValue: 0,
          totalNftCount: 0,
          connectedChains: 1,
          lastUpdated: new Date(),
          balances: [activeChainBalance]
        };

        setData(liveData);
        setMode('LIVE');
      } catch (err) {
        console.error("Failed to fetch live data:", err);
        // Fallback to mock if fetch fails? Master prompt says "If connected -> real"
        // If real fails, we keep it as null or error state to be strict.
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveDetails();
  }, [isConnected, account]);

  const processedData = useMemo(() => {
    if (!data) return null;

    const flatAssets = data.balances.flatMap(b => b.assets.map(a => ({
      ...a,
      chainId: b.chainId,
      chainName: b.chainName,
      price: a.balance > 0 ? a.valueUsd / a.balance : (a.symbol === 'ETH' ? 2000 : 1),
      allocation: data.totalValue > 0 ? (a.valueUsd / data.totalValue) * 100 : 0
    })));

    // MASTER PROMPT Calculation logic for Risk/Health should probably be here or in pages
    // But processedData can provide basic metrics
    const ethAsset = flatAssets.find(a => a.symbol === 'ETH');
    const ethBalance = ethAsset?.balance || 0;
    const ethPrice = mode === 'DEMO' ? 2000 : (ethAsset?.price || 2000);
    const totalValue = data.totalValue;

    return {
      ...data,
      eth: ethBalance,
      usdc: flatAssets.find(a => a.symbol === 'USDC')?.balance || 0,
      ethPrice,
      total_value_usd: totalValue, // Aligning naming with prompt
      assets: flatAssets,
      allocation: {
        eth: totalValue > 0 ? ((ethAsset?.valueUsd || 0) / totalValue) * 100 : 0,
        usdc: totalValue > 0 ? ((flatAssets.find(a => a.symbol === 'USDC')?.valueUsd || 0) / totalValue) * 100 : 0
      }
    };
  }, [data, mode]);

  return { data: processedData, mode, isLoading, isConnected };
}
