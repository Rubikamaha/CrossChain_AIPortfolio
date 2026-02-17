import { AIAnalysis } from './aiService';
import { PortfolioData } from './walletService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface InsightHistoryItem {
    _id: string;
    walletAddress: string;
    timestamp: Date;
    portfolioSnapshot: {
        totalValue: number;
        balances: Array<{
            chainName: string;
            chainId: number;
            symbol: string;
            balance: number;
            valueUSD: number;
        }>;
        connectedChains: number;
    };
    analysis: {
        healthScore: number;
        riskLevel: 'Low' | 'Medium' | 'High';
        summary: string;
        diversification?: string;
        performance?: string;
        volatility?: string;
    };
    recommendations: Array<{
        type: 'Buy' | 'Sell' | 'Hold';
        asset: string;
        reason: string;
        priority?: number;
    }>;
    topPick?: {
        asset: string;
        reason: string;
    };
    predictions?: {
        expectedReturn7d?: number;
        expectedReturn30d?: number;
        confidenceScore?: number;
        marketOutlook?: string;
    };
    anomalies?: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        detectedAt: Date;
    }>;
    rebalancing?: {
        needed: boolean;
        actions: Array<{
            type: 'buy' | 'sell' | 'hold';
            asset: string;
            amount: number;
            currentAllocation: number;
            targetAllocation: number;
            reason: string;
        }>;
    };
    userProfile?: {
        riskPersonality: string;
        learningMode: string;
    };
    marketContext?: {
        sentiment?: 'bullish' | 'bearish' | 'neutral';
        btcPrice?: number;
        ethPrice?: number;
        fearGreedIndex?: number;
    };
    createdAt: Date;
}

export interface TrendData {
    healthScoreTrend: number[];
    riskTrend: string[];
    valueTrend: number[];
    timestamps: Date[];
    dataPoints: number;
}

export interface ComparisonData {
    current: InsightHistoryItem | null;
    previous: InsightHistoryItem | null;
    changes: {
        healthScore: number;
        riskLevel: string;
        totalValue: number;
        totalValuePercent: string;
        timeDiff: number;
    } | null;
    message?: string;
}

export interface InsightStats {
    totalInsights: number;
    latestInsight: InsightHistoryItem | null;
    averageHealthScore: number;
    maxHealthScore: number;
    minHealthScore: number;
    firstInsightDate: Date | null;
}

export const insightHistoryService = {
    /**
     * Save an insight to history
     */
    async saveInsight(
        walletAddress: string,
        analysis: AIAnalysis,
        portfolioSnapshot: PortfolioData,
        marketContext?: any
    ): Promise<{ success: boolean; insightId: string; timestamp: Date }> {
        try {
            const response = await fetch(`${BACKEND_URL}/api/insights/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress,
                    analysis,
                    portfolioSnapshot: {
                        totalValue: portfolioSnapshot.totalValue,
                        balances: portfolioSnapshot.balances,
                        connectedChains: portfolioSnapshot.connectedChains
                    },
                    marketContext
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save insight');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving insight:', error);
            throw error;
        }
    },

    /**
     * Get historical insights for a wallet
     */
    async getInsightHistory(
        walletAddress: string,
        options: {
            limit?: number;
            offset?: number;
            startDate?: Date;
            endDate?: Date;
        } = {}
    ): Promise<{
        insights: InsightHistoryItem[];
        total: number;
        hasMore: boolean;
        limit: number;
        offset: number;
    }> {
        try {
            const params = new URLSearchParams();
            if (options.limit) params.append('limit', options.limit.toString());
            if (options.offset) params.append('offset', options.offset.toString());
            if (options.startDate) params.append('startDate', options.startDate.toISOString());
            if (options.endDate) params.append('endDate', options.endDate.toISOString());

            const response = await fetch(
                `${BACKEND_URL}/api/insights/history/${walletAddress}?${params.toString()}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch history');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching insight history:', error);
            // Return empty result on error
            return {
                insights: [],
                total: 0,
                hasMore: false,
                limit: options.limit || 10,
                offset: options.offset || 0
            };
        }
    },

    /**
     * Get trend data for charts
     */
    async getTrendData(
        walletAddress: string,
        days: number = 30
    ): Promise<TrendData> {
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/insights/trends/${walletAddress}?days=${days}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch trends');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching trend data:', error);
            // Return empty trend data on error
            return {
                healthScoreTrend: [],
                riskTrend: [],
                valueTrend: [],
                timestamps: [],
                dataPoints: 0
            };
        }
    },

    /**
     * Compare current vs previous insight
     */
    async compareInsights(walletAddress: string): Promise<ComparisonData> {
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/insights/compare/${walletAddress}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to compare insights');
            }

            return await response.json();
        } catch (error) {
            console.error('Error comparing insights:', error);
            return {
                current: null,
                previous: null,
                changes: null,
                message: 'Unable to load comparison data'
            };
        }
    },

    /**
     * Get insight statistics for a wallet
     */
    async getStats(walletAddress: string): Promise<InsightStats> {
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/insights/stats/${walletAddress}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch stats');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                totalInsights: 0,
                latestInsight: null,
                averageHealthScore: 0,
                maxHealthScore: 0,
                minHealthScore: 0,
                firstInsightDate: null
            };
        }
    },

    /**
     * Check if there's recent insight (less than 1 hour old)
     */
    async hasRecentInsight(walletAddress: string): Promise<boolean> {
        try {
            const stats = await this.getStats(walletAddress);
            if (!stats.latestInsight) return false;

            const oneHour = 60 * 60 * 1000;
            const latestTime = new Date(stats.latestInsight.timestamp).getTime();
            return (Date.now() - latestTime) < oneHour;
        } catch (error) {
            return false;
        }
    }
};
