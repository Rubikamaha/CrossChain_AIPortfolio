import { type PortfolioData } from '@/lib/walletService';

/**
 * Realistic mock portfolio data for Demo Mode
 */
export const mockPortfolioData: PortfolioData = {
  address: '0x0000000000000000000000000000000000000000',
  totalValue: 2290.90,
  totalTokenValue: 450.00,
  totalNftValue: 0,
  totalNftCount: 0,
  connectedChains: 2,
  lastUpdated: new Date(),
  balances: [
    {
      chainId: 1,
      chainName: 'Ethereum',
      symbol: 'ETH',
      balance: '820000000000000000',
      balanceFormatted: 0.82,
      usdValue: 1840.90,
      assets: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 0.82,
          valueUsd: 1840.90,
          isToken: false
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 450.00,
          valueUsd: 450.00,
          isToken: true,
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        }
      ]
    }
  ]
};
