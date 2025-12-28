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
  { name: 'AI Insights', href: '/insights', active: false },
  { name: 'Rebalancing', href: '/rebalancing', active: false },
  { name: 'Transactions', href: '/transactions', active: false },
  { name: 'Profile', href: '/profile', active: false },
];
