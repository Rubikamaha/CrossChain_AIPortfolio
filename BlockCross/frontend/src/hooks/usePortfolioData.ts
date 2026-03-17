import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { walletService } from '@/services/walletService';
import { priceService } from '@/services/priceService';
import { mockPortfolioData } from '@/data/mockPortfolio';
import { type PortfolioData, type ChainBalance } from '@/lib/walletService';

export type PortfolioMode = 'DEMO' | 'LIVE';

export function usePortfolioData() {
  const { isConnected, account } = useWallet();
  const [data, setData] = useState<PortfolioData>(mockPortfolioData);
  const [mode, setMode] = useState<PortfolioMode>('DEMO');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !account) {
      setData(mockPortfolioData);
      setMode('DEMO');
      return;
    }

    const fetchLiveDetails = async () => {
      setIsLoading(true);
      try {
        const [ethBalance, usdcBalance, prices] = await Promise.all([
          walletService.getETHBalance(account),
          walletService.getERC20Balance(account, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), // Mainnet USDC
          priceService.getPrices()
        ]);

        const ethValue = ethBalance * (prices.ETH || 2245);
        const usdcValue = usdcBalance * (prices.USDC || 1);
        const totalValue = ethValue + usdcValue;

        const mainnetBalance: ChainBalance = {
          chainId: 1,
          chainName: 'Ethereum',
          symbol: 'ETH',
          balance: '0', // Placeholder
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
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
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
          balances: [mainnetBalance]
        };

        setData(liveData);
        setMode('LIVE');
      } catch (err) {
        console.error("Failed to fetch live data:", err);
        setData(mockPortfolioData);
        setMode('DEMO');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveDetails();
  }, [isConnected, account]);

  return { data, mode, isLoading };
}
