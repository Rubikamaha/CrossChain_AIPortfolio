import { PortfolioData } from './walletService';
import { type RiskPersonality, type LearningMode } from '@/contexts/ProfileContext';

export interface AIAnalysis {
    wallet: string;
    totalValue: number;
    structuredAnalysis: {
        portfolio_summary: string;
        risk_assessment: string;
        diversification_analysis: string;
        chain_exposure_commentary: string;
        optimization_recommendations: string;
    };
    analytics: {
        environment: string;
        total_value_usd: number;
        active_chains: number;
        chain_distribution: Record<string, number>;
        asset_distribution: Record<string, number>;
        stablecoin_ratio: number;
        top_asset_concentration: number;
        risk_score: number;
        volatility_exposure_level: string;
        insight_mode: string;
    };

    // Legacy fields mapped for backward UI compatibility where needed
    healthScore?: number;
}

export interface TokenPrice {
    usd: number;
    usd_24h_change: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const aiService = {
    async fetchTokenPrices(ids: string[]): Promise<Record<string, TokenPrice>> {
        try {
            if (ids.length === 0) return {};

            const response = await fetch(`${BACKEND_URL}/api/prices?ids=${ids.join(',')}`);
            if (!response.ok) throw new Error('Failed to fetch prices');

            return await response.json();
        } catch (error) {
            console.error('Price fetch error:', error);
            return {};
        }
    },

    async generatePortfolioAnalysis(
        portfolio: PortfolioData,
        userProfile?: {
            riskPersonality: RiskPersonality,
            learningMode: LearningMode,
            healthScore?: number,
            insightMode?: string,
            notifications?: {
                highRiskAlert: boolean;
                imbalanceAlert: boolean;
            }
        }
    ): Promise<AIAnalysis> {
        try {
            const response = await fetch(`${BACKEND_URL}/api/insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    portfolio,
                    userProfile: {
                        ...userProfile,
                        insightMode: userProfile?.insightMode || 'Market Mode'
                    },
                    network: 'cross-chain'
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate analysis');
            }

            const data = await response.json();

            if (data.structuredAnalysis) {
                data.healthScore = Math.max(0, 100 - (data.analytics?.risk_score || 0));
            }

            return data as AIAnalysis;
        } catch (error) {
            console.error('AI Analysis error:', error);
            throw error;
        }
    }
};
