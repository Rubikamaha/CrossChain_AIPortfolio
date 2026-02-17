import { PortfolioData } from './walletService';
import { type RiskPersonality, type LearningMode } from '@/contexts/ProfileContext';

export interface AIAnalysis {
    summary: string;
    healthScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskFactors: string[];
    chainOutlook: Array<{
        chain: string;
        outlook: 'Great' | 'Good' | 'Neutral' | 'Caution';
        reason: string;
    }>;
    analysis: {
        diversification: string;
        performance: string;
        volatility: string;
    };
    recommendations: Array<{
        type: 'Buy' | 'Sell' | 'Hold';
        asset: string;
        reason: string;
        confidence?: 'Low' | 'Medium' | 'High';
        timeHorizon?: 'Short Term' | 'Medium Term' | 'Long Term' | 'Immediate';
    }>;
    topPick: {
        asset: string;
        reason: string;
    };
}

export interface TokenPrice {
    usd: number;
    usd_24h_change: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const aiService = {
    /**
     * Fetch real-time prices for tokens from backend
     */
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

    /**
     * Generate AI analysis for the portfolio
     */
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
                body: JSON.stringify({ portfolio, userProfile }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate analysis');
            }

            return await response.json();
        } catch (error) {
            console.error('AI Analysis error:', error);
            throw error;
        }
    }
};
