// Chain configuration matching backend server.js
export type NetworkMode = 'mainnet' | 'testnet' | 'all';

export interface ChainConfig {
    chainId: number;
    name: string;
    symbol: string;
    icon: string;
    type: 'mainnet' | 'testnet';
    coingeckoId?: string;
    rpcUrl?: string; // Not used directly, backend handles this
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
    // Mainnets
    1: {
        chainId: 1,
        name: 'Ethereum',
        symbol: 'ETH',
        icon: '⟠',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },
    137: {
        chainId: 137,
        name: 'Polygon',
        symbol: 'MATIC',
        icon: '⬡',
        type: 'mainnet',
        coingeckoId: 'matic-network',
    },
    42161: {
        chainId: 42161,
        name: 'Arbitrum',
        symbol: 'ETH',
        icon: '◆',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },
    10: {
        chainId: 10,
        name: 'Optimism',
        symbol: 'ETH',
        icon: '🔴',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },
    8453: {
        chainId: 8453,
        name: 'Base',
        symbol: 'ETH',
        icon: '🔵',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },
    43114: {
        chainId: 43114,
        name: 'Avalanche',
        symbol: 'AVAX',
        icon: '🔺',
        type: 'mainnet',
        coingeckoId: 'avalanche-2',
    },
    56: {
        chainId: 56,
        name: 'BSC',
        symbol: 'BNB',
        icon: '💛',
        type: 'mainnet',
        coingeckoId: 'binancecoin',
    },
    1101: {
        chainId: 1101,
        name: 'Polygon zkEVM',
        symbol: 'ETH',
        icon: '💜',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },
    59144: {
        chainId: 59144,
        name: 'Linea',
        symbol: 'ETH',
        icon: '⚫',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },
    534352: {
        chainId: 534352,
        name: 'Scroll',
        symbol: 'ETH',
        icon: '📜',
        type: 'mainnet',
        coingeckoId: 'ethereum',
    },

    // Testnets
    11155111: {
        chainId: 11155111,
        name: 'Sepolia',
        symbol: 'ETH',
        icon: '⟠',
        type: 'testnet',
        coingeckoId: 'ethereum',
    },
    17000: {
        chainId: 17000,
        name: 'Holesky',
        symbol: 'ETH',
        icon: '⟠',
        type: 'testnet',
        coingeckoId: 'ethereum',
    },
    80002: {
        chainId: 80002,
        name: 'Polygon Amoy',
        symbol: 'MATIC',
        icon: '⬡',
        type: 'testnet',
        coingeckoId: 'matic-network',
    },
    97: {
        chainId: 97,
        name: 'BSC Testnet',
        symbol: 'BNB',
        icon: '💛',
        type: 'testnet',
        coingeckoId: 'binancecoin',
    },
    421614: {
        chainId: 421614,
        name: 'Arbitrum Sepolia',
        symbol: 'ETH',
        icon: '◆',
        type: 'testnet',
        coingeckoId: 'ethereum',
    },
    11155420: {
        chainId: 11155420,
        name: 'Optimism Sepolia',
        symbol: 'ETH',
        icon: '🔴',
        type: 'testnet',
        coingeckoId: 'ethereum',
    },
    84532: {
        chainId: 84532,
        name: 'Base Sepolia',
        symbol: 'ETH',
        icon: '🔵',
        type: 'testnet',
        coingeckoId: 'ethereum',
    },
    43113: {
        chainId: 43113,
        name: 'Avalanche Fuji',
        symbol: 'AVAX',
        icon: '🔺',
        type: 'testnet',
        coingeckoId: 'avalanche-2',
    },
};

// Helper functions
export const getAllChains = (): ChainConfig[] => {
    return Object.values(CHAIN_CONFIGS);
};

export const getChainsByMode = (mode: NetworkMode): ChainConfig[] => {
    if (mode === 'all') return getAllChains();
    return getAllChains().filter(chain => chain.type === mode);
};

export const getMainnetChains = (): ChainConfig[] => {
    return getAllChains().filter(chain => chain.type === 'mainnet');
};

export const getTestnetChains = (): ChainConfig[] => {
    return getAllChains().filter(chain => chain.type === 'testnet');
};

export const getChainConfig = (chainId: number): ChainConfig | undefined => {
    return CHAIN_CONFIGS[chainId];
};

export const getChainName = (chainId: number): string => {
    return CHAIN_CONFIGS[chainId]?.name || `Chain ${chainId}`;
};

export const getChainSymbol = (chainId: number): string => {
    return CHAIN_CONFIGS[chainId]?.symbol || 'ETH';
};

export const isMainnet = (chainId: number): boolean => {
    return CHAIN_CONFIGS[chainId]?.type === 'mainnet';
};

export const isTestnet = (chainId: number): boolean => {
    return CHAIN_CONFIGS[chainId]?.type === 'testnet';
};

// Chain colors for charts
export const CHAIN_COLORS: Record<number, string> = {
    1: '#627EEA',      // Ethereum - Blue
    137: '#8247E5',    // Polygon - Purple
    42161: '#28A0F0',  // Arbitrum - Light Blue
    10: '#FF0420',     // Optimism - Red
    8453: '#0052FF',   // Base - Blue
    43114: '#E84142',  // Avalanche - Red
    56: '#F3BA2F',     // BSC - Yellow
    1101: '#8247E5',   // Polygon zkEVM - Purple
    59144: '#000000',  // Linea - Black
    534352: '#FFF6D8', // Scroll - Beige/Yellow
    11155111: '#627EEA', // Sepolia
    17000: '#627EEA',    // Holesky
    80002: '#8247E5',    // Polygon Amoy
    97: '#F3BA2F',       // BSC Testnet
    421614: '#28A0F0',   // Arbitrum Sepolia
    11155420: '#FF0420', // Optimism Sepolia
    84532: '#0052FF',    // Base Sepolia
    43113: '#E84142',    // Avalanche Fuji
};

export const getChainColor = (chainId: number): string => {
    return CHAIN_COLORS[chainId] || '#888888';
};
