import { type PortfolioData } from '@/lib/walletService';

/**
 * Realistic mock portfolio data for Demo Mode
 * Aligned with user's expected "original" values: 9.8185 ETH (~$20,964.53)
 */
export const mockPortfolioData: PortfolioData = {
  address: '0x0000000000000000000000000000000000000000',
  totalValue: 35964.53, // 20964.53 (ETH) + 15000 (USDC)
  totalTokenValue: 15000.00,
  totalNftValue: 0,
  totalNftCount: 0,
  connectedChains: 2,
  lastUpdated: new Date(),
  balances: [
    {
      chainId: 1,
      chainName: 'Ethereum',
      symbol: 'ETH',
      balance: '9818500000000000000', // 9.8185 ETH in wei
      balanceFormatted: 9.8185,
      usdValue: 20964.53,
      tokenValue: 15000.0,
      assets: [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 9.8185,
          valueUsd: 20964.53,
          isToken: false
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 15000.0,
          valueUsd: 15000.0,
          isToken: true,
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        }
      ]
    }
  ]
};

