export const portfolioStats = {
  totalValue: 247892.45,
  connectedChains: 5,
  totalAssets: 23,
  riskScore: 'Medium' as const,
  riskValue: 58,
  change24h: 3.42,
};

export const chainDistribution = [
  { name: 'Ethereum', value: 45, color: '#627EEA' },
  { name: 'Bitcoin', value: 25, color: '#F7931A' },
  { name: 'Polygon', value: 15, color: '#8247E5' },
  { name: 'Solana', value: 10, color: '#14F195' },
  { name: 'Avalanche', value: 5, color: '#E84142' },
];

export const portfolioGrowth = [
  { date: 'Jan', value: 180000 },
  { date: 'Feb', value: 195000 },
  { date: 'Mar', value: 178000 },
  { date: 'Apr', value: 210000 },
  { date: 'May', value: 225000 },
  { date: 'Jun', value: 215000 },
  { date: 'Jul', value: 247892 },
];

export const assets = [
  { chain: 'Ethereum', asset: 'ETH', balance: 32.5, valueUsd: 78540.25, change24h: 2.34, icon: '⟠' },
  { chain: 'Bitcoin', asset: 'BTC', balance: 1.85, valueUsd: 62015.00, change24h: 1.87, icon: '₿' },
  { chain: 'Ethereum', asset: 'USDC', balance: 25000, valueUsd: 25000.00, change24h: 0.01, icon: '💵' },
  { chain: 'Polygon', asset: 'MATIC', balance: 15420, valueUsd: 18504.00, change24h: -1.23, icon: '🔷' },
  { chain: 'Solana', asset: 'SOL', balance: 285, valueUsd: 24795.00, change24h: 5.67, icon: '◎' },
  { chain: 'Avalanche', asset: 'AVAX', balance: 450, valueUsd: 12150.00, change24h: -0.45, icon: '🔺' },
  { chain: 'Ethereum', asset: 'LINK', balance: 850, valueUsd: 11050.00, change24h: 3.21, icon: '⬡' },
  { chain: 'Polygon', asset: 'AAVE', balance: 125, valueUsd: 10625.00, change24h: 4.12, icon: '👻' },
];

export const aiInsight = {
  recommendation: 'Hold' as const,
  confidence: 87,
  summary: 'Market conditions suggest maintaining current positions. Consider rebalancing towards stablecoins if volatility increases.',
  topPick: {
    asset: 'SOL',
    action: 'Accumulate',
    reason: 'Strong momentum with upcoming ecosystem developments',
  },
};

export const alerts = [
  { type: 'price', message: 'ETH crossed $2,400 resistance', time: '2 min ago', severity: 'info' as const },
  { type: 'volatility', message: 'High volatility detected on SOL', time: '15 min ago', severity: 'warning' as const },
  { type: 'ai', message: 'AI recommends reducing AVAX exposure', time: '1 hour ago', severity: 'info' as const },
  { type: 'price', message: 'BTC reached new weekly high', time: '3 hours ago', severity: 'success' as const },
];

export const navItems = [
  { name: 'Dashboard', href: '/', active: true },
  { name: 'Insights', href: '/insights', active: false },
  { name: 'Rebalance', href: '/rebalance', active: false },
  { name: 'Swap', href: '/transactions', active: false },
  { name: 'Profile', href: '/profile', active: false },
];

// Mock Portfolio Data matching walletService interface
export const mockPortfolioData = {
  totalValue: 247892.45,
  totalTokenValue: 125000.00,
  totalNftValue: 45000.00,
  totalNftCount: 12,
  connectedChains: 5,
  lastUpdated: new Date(),
  balances: [
    {
      chainId: 1,
      chainName: 'Ethereum',
      symbol: 'ETH',
      balance: '32500000000000000000', // 32.5 ETH
      balanceFormatted: 32.5,
      usdValue: 78540.25,
      tokenValue: 36050.00,
      nftValue: 45000.00,
      nftCount: 12,
      assets: [
        { symbol: 'ETH', balance: 32.5, valueUsd: 78540.25, name: 'Ethereum', isToken: false },
        { symbol: 'USDC', balance: 25000, valueUsd: 25000.00, name: 'USD Coin', isToken: true },
        { symbol: 'LINK', balance: 850, valueUsd: 11050.00, name: 'Chainlink', isToken: true }
      ]
    },
    {
      chainId: 137,
      chainName: 'Polygon',
      symbol: 'MATIC',
      balance: '15420000000000000000000', // 15,420 MATIC
      balanceFormatted: 15420,
      usdValue: 18504.00,
      tokenValue: 10625.00,
      nftValue: 0,
      nftCount: 0,
      assets: [
        { symbol: 'MATIC', balance: 15420, valueUsd: 18504.00, name: 'Polygon', isToken: false },
        { symbol: 'AAVE', balance: 125, valueUsd: 10625.00, name: 'Aave', isToken: true }
      ]
    },
    {
      chainId: 56,
      chainName: 'BSC',
      symbol: 'BNB',
      balance: '45000000000000000000', // 45 BNB
      balanceFormatted: 45,
      usdValue: 13500.00,
      tokenValue: 5000.00,
      nftValue: 0,
      nftCount: 0,
      assets: [
        { symbol: 'BNB', balance: 45, valueUsd: 13500.00, name: 'Binance Coin', isToken: false },
        { symbol: 'CAKE', balance: 1200, valueUsd: 5000.00, name: 'PancakeSwap', isToken: true }
      ]
    },
    {
      chainId: 42161,
      chainName: 'Arbitrum',
      symbol: 'ETH',
      balance: '5000000000000000000', // 5 ETH
      balanceFormatted: 5.0,
      usdValue: 12000.00,
      tokenValue: 8000.00,
      nftValue: 0,
      nftCount: 0,
      assets: [
        { symbol: 'ETH', balance: 5.0, valueUsd: 12000.00, name: 'Ethereum', isToken: false },
        { symbol: 'ARB', balance: 5000, valueUsd: 8000.00, name: 'Arbitrum', isToken: true }
      ]
    },
    {
      chainId: 11155111,
      chainName: 'Sepolia',
      symbol: 'ETH',
      balance: '2500000000000000000', // 2.5 ETH
      balanceFormatted: 2.5,
      usdValue: 0, // Testnet has 0 value usually, but let's give it some for visual presence? No, usually 0.
      tokenValue: 0,
      assets: [
        { symbol: 'ETH', balance: 2.5, valueUsd: 0, name: 'Sepolia ETH', isToken: false }
      ]
    }
  ]
};
