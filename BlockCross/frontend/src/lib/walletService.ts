// Wallet service for fetching multi-chain balances
import { getBalance, weiToEther, BACKEND_URL, getTokenBalances, getTokenMetadata, getNfts, type TokenBalance } from './rpcService';
import { getChainConfig, type ChainConfig } from './chainConfig';

export interface ChainAsset {
    symbol: string;
    balance: number;
    valueUsd: number;
    name?: string;
    logo?: string;
    isToken?: boolean;
    contractAddress?: string;
}

export interface ChainBalance {
    chainId: number;
    chainName: string;
    symbol: string;
    balance: string; // in wei
    balanceFormatted: number; // in ether
    usdValue?: number;
    tokenValue?: number; // Value of ERC20 tokens
    nftValue?: number; // Estimated NFT value
    nftCount?: number;
    assets: ChainAsset[]; // List of all assets on this chain
    error?: string;
}

export interface PortfolioData {
    totalValue: number;
    totalTokenValue: number;
    totalNftValue: number; // Placeholder for now, mostly count based
    totalNftCount: number;
    balances: ChainBalance[];
    connectedChains: number;
    lastUpdated: Date;
}

/**
 * Fetch tokens for a chain
 */
async function fetchChainTokens(chainId: number, address: string): Promise<{ value: number, assets: ChainAsset[] }> {
    try {
        const balances = await getTokenBalances(chainId, address);

        // Safety check: ensure balances is an array
        if (!Array.isArray(balances)) {
            return { value: 0, assets: [] };
        }

        // Filter tokens with zero balance
        const nonZeroTokens = balances.filter(b => b.tokenBalance && b.tokenBalance !== "0x" && BigInt(b.tokenBalance) > 0n);

        const assets: ChainAsset[] = [];

        // Limit to top 10 to avoid request spam for metadata
        const tokensToProcess = nonZeroTokens.slice(0, 10);

        for (const token of tokensToProcess) {
            // Create initial asset (we update it after metadata)
            const asset: ChainAsset = {
                symbol: '...', // Placeholder
                name: 'Loading...',
                balance: 0,
                valueUsd: 0,
                contractAddress: token.contractAddress,
                isToken: true
            };

            try {
                // Fetch metadata using backend proxy
                const metadata = await getTokenMetadata(chainId, token.contractAddress);

                asset.name = metadata.name || 'Unknown Token';
                asset.symbol = metadata.symbol || 'ERC20';
                asset.logo = metadata.logo || undefined;

                if (metadata.decimals) {
                    const bal = BigInt(token.tokenBalance);
                    asset.balance = Number(bal) / Math.pow(10, metadata.decimals);
                } else {
                    asset.balance = 0;
                }
            } catch (err) {
                // Silent fail for metadata
                asset.name = 'Unknown Token';
            }

            assets.push(asset);
        }

        return { value: 0, assets };
    } catch (e: any) {
        // Suppress 400/500/404 errors common on testnets for Enhanced APIs
        const isExpectedError = e?.message?.includes('400') || e?.message?.includes('500') || e?.message?.includes('404');
        if (!isExpectedError) {
            console.warn(`[Supressed] Token fetch failed for chain ${chainId}`);
        }
        return { value: 0, assets: [] };
    }
}

/**
 * Fetch NFTs for a chain
 */
async function fetchChainNfts(chainId: number, address: string): Promise<{ count: number, value: number }> {
    try {
        // Only fetch NFTs for mainnets to save resources/time
        const config = getChainConfig(chainId);
        if (config?.type !== 'mainnet') return { count: 0, value: 0 };

        const data = await getNfts(chainId, address);
        return { count: data.totalCount, value: 0 };
    } catch (e) {
        // console.warn(`Failed to fetch NFTs for chain ${chainId}`, e);
        return { count: 0, value: 0 };
    }
}

/**
 * Fetch balance for a single chain
 */
async function fetchChainBalance(
    chainId: number,
    address: string
): Promise<ChainBalance> {
    const chainConfig = getChainConfig(chainId);

    if (!chainConfig) {
        return {
            chainId,
            chainName: `Chain ${chainId}`,
            symbol: 'ETH',
            balance: '0',
            balanceFormatted: 0,
            error: 'Unknown chain',
            assets: []
        };
    }

    try {
        console.log(`[walletService] Fetching ${chainConfig.name} balance for ${address}...`);
        const balance = await getBalance(chainId, address);
        console.log(`[walletService] Raw balance for ${chainConfig.name}:`, balance);

        const balanceFormatted = weiToEther(balance);
        console.log(`[walletService] Formatted balance for ${chainConfig.name}: ${balanceFormatted} ${chainConfig.symbol}`);

        // Fetch tokens and NFTs in parallel
        const [tokenData, nftData] = await Promise.all([
            fetchChainTokens(chainId, address),
            fetchChainNfts(chainId, address)
        ]);

        return {
            chainId,
            chainName: chainConfig.name,
            symbol: chainConfig.symbol,
            balance,
            balanceFormatted,
            tokenValue: tokenData.value,
            nftValue: nftData.value,
            nftCount: nftData.count,
            assets: [{
                symbol: chainConfig.symbol,
                balance: balanceFormatted,
                valueUsd: 0, // Will be updated later
                name: chainConfig.name,
                isToken: false
            }, ...tokenData.assets]
        };
    } catch (error) {
        console.error(`[walletService] FATAL Error for ${chainConfig.name}:`, error);
        return {
            chainId,
            chainName: chainConfig.name,
            symbol: chainConfig.symbol,
            balance: '0',
            balanceFormatted: 0,
            error: error instanceof Error ? error.message : 'Failed to fetch balance',
            assets: []
        };
    }
}

/**
 * Fetch balances across multiple chains concurrently
 */
export async function fetchMultiChainBalances(
    address: string,
    chainIds: number[]
): Promise<ChainBalance[]> {
    if (!address) {
        throw new Error('Address is required');
    }

    // Fetch all balances concurrently
    const balancePromises = chainIds.map(chainId =>
        fetchChainBalance(chainId, address)
    );

    return Promise.all(balancePromises);
}

/**
 * Fetch token prices from backend
 */
export async function fetchTokenPrices(ids: string[]): Promise<Record<string, number>> {
    if (ids.length === 0) return {};

    try {
        const response = await fetch(`${BACKEND_URL}/api/prices?ids=${ids.join(',')}`);
        if (!response.ok) {
            console.error(`Backend price API failed: ${response.status} ${response.statusText}`);
            return {};
        }
        const data = await response.json();
        console.log('Price data received:', data);

        const prices: Record<string, number> = {};
        Object.entries(data).forEach(([id, value]: [string, any]) => {
            if (value && typeof value.usd === 'number') {
                prices[id] = value.usd;
            }
        });
        return prices;
    } catch (error) {
        console.error('Error fetching token prices:', error);
        return {};
    }
}

/**
 * Calculate total portfolio value
 */
export function calculatePortfolioValue(
    balances: ChainBalance[],
    prices: Record<string, number>
): number {
    return balances.reduce((total, balance) => {
        const config = getChainConfig(balance.chainId);
        const coingeckoId = config?.coingeckoId;
        const price = coingeckoId ? prices[coingeckoId] : 0;

        // Also update the balance's usdValue if we have a price
        if (price !== undefined) {
            balance.usdValue = balance.balanceFormatted * price;
        } else {
            balance.usdValue = 0;
        }

        return total + (balance.usdValue || 0);
    }, 0);
}

/**
 * Get portfolio data with all balances and total value
 */
export async function getPortfolioData(
    address: string,
    chainIds: number[]
): Promise<PortfolioData> {
    console.log(`[walletService] Starting portfolio aggregation for ${address} on chains:`, chainIds);
    const balances = await fetchMultiChainBalances(address, chainIds);
    console.log(`[walletService] Retreived ${balances.length} balance results.`);

    // Get unique coingecko IDs for price fetching
    const coingeckoIds = Array.from(new Set(
        chainIds
            .map(id => getChainConfig(id)?.coingeckoId)
            .filter((id): id is string => !!id)
    ));

    // Fetch real-time prices
    const prices = await fetchTokenPrices(coingeckoIds);
    console.log('Fetched prices:', prices);

    // Filter out chains with errors for connected count
    const successfulBalances = balances.filter(b => !b.error);

    // Calculate total value and update individual balance usdValues
    const totalValue = calculatePortfolioValue(balances, prices);

    // Aggregate Token and NFT stats
    const totalTokenValue = balances.reduce((acc, b) => acc + (b.tokenValue || 0), 0);
    const totalNftValue = balances.reduce((acc, b) => acc + (b.nftValue || 0), 0);
    const totalNftCount = balances.reduce((acc, b) => acc + (b.nftCount || 0), 0);

    console.log('Portfolio balances with USD values:', balances);
    console.log('Total Portfolio Value:', totalValue);

    return {
        totalValue,
        totalTokenValue,
        totalNftValue,
        totalNftCount,
        balances,
        connectedChains: successfulBalances.length,
        lastUpdated: new Date(),
    };
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Get non-zero balances only
 */
export function getNonZeroBalances(balances: ChainBalance[]): ChainBalance[] {
    return balances.filter(b => b.balanceFormatted > 0 && !b.error);
}

/**
 * Group balances by chain type
 */
export function groupBalancesByType(balances: ChainBalance[]): {
    mainnet: ChainBalance[];
    testnet: ChainBalance[];
} {
    const mainnet: ChainBalance[] = [];
    const testnet: ChainBalance[] = [];

    balances.forEach(balance => {
        const config = getChainConfig(balance.chainId);
        if (config?.type === 'mainnet') {
            mainnet.push(balance);
        } else {
            testnet.push(balance);
        }
    });

    return { mainnet, testnet };
}

/**
 * Calculate Portfolio Health Score (0-100)
 */
export function calculateHealthScore(
    portfolio: PortfolioData,
    riskPersonality: string = 'Balanced'
): { score: number; explanation: string; imbalanceDetected: boolean } {
    let score = 0;
    let imbalanceDetected = false;
    const insights: string[] = [];
    const successfulBalances = portfolio.balances.filter(b => b.balanceFormatted > 0 && !b.error);
    const nonZeroCount = successfulBalances.length;
    const chainIds = new Set(successfulBalances.map(b => b.chainId));
    const uniqueChainsCount = chainIds.size;

    // Adjust thresholds based on Risk Personality
    const thresholds = {
        Conservative: { maxConcentration: 0.3, minChains: 3, assetScore: 15 },
        Balanced: { maxConcentration: 0.5, minChains: 2, assetScore: 10 },
        Aggressive: { maxConcentration: 0.8, minChains: 1, assetScore: 5 }
    }[riskPersonality as keyof typeof thresholds] || { maxConcentration: 0.5, minChains: 2, assetScore: 10 };

    // 1. Diversification (max 40 points)
    if (nonZeroCount >= 3) {
        score += 40;
        insights.push("Excellent asset diversification.");
    } else if (nonZeroCount === 2) {
        score += 25;
        insights.push("Moderate diversification.");
    } else if (nonZeroCount === 1) {
        score += thresholds.assetScore;
        insights.push(`Highly concentrated portfolio (${riskPersonality} mode).`);
        if (riskPersonality === 'Conservative') imbalanceDetected = true;
    } else {
        insights.push("No assets found in the portfolio.");
    }

    // 2. Cross-chain Distribution (max 30 points)
    if (uniqueChainsCount >= thresholds.minChains) {
        score += 30;
        insights.push("Strong cross-chain presence.");
    } else if (uniqueChainsCount >= 1 && nonZeroCount > 0) {
        score += 15;
        insights.push("Limited chain distribution may increase network risk.");
        if (riskPersonality === 'Conservative' && uniqueChainsCount < 2) imbalanceDetected = true;
    }

    // 3. Risk Exposure / Concentration (max 30 points)
    if (portfolio.totalValue > 0) {
        const maxConcentration = Math.max(...successfulBalances.map(b => (b.usdValue || 0) / portfolio.totalValue));

        if (maxConcentration <= thresholds.maxConcentration) {
            score += 30;
            insights.push("Well-balanced asset allocation.");
        } else {
            // Penalize more if conservative
            const penalty = riskPersonality === 'Conservative' ? 20 : riskPersonality === 'Aggressive' ? 5 : 10;
            score += Math.max(5, 30 - penalty);
            insights.push(`High asset concentration detected (> ${thresholds.maxConcentration * 100}%).`);
            imbalanceDetected = true;
        }
    } else if (nonZeroCount > 0) {
        score += 15;
    }

    // Adjust score based on risk mismatch
    if (imbalanceDetected && riskPersonality === 'Conservative') {
        score = Math.max(0, score - 10);
        insights.push("Significant risk exposure for a conservative profile.");
    }

    let finalExplanation = insights.join(" ");
    if (score >= 80) {
        finalExplanation = "Excellent! " + finalExplanation;
    } else if (score >= 50) {
        finalExplanation = "Good. " + finalExplanation;
    } else {
        finalExplanation = "Needs attention. " + finalExplanation;
    }

    return {
        score: Math.min(100, score),
        explanation: finalExplanation,
        imbalanceDetected
    };
}
