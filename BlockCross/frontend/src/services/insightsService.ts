/**
 * Service for generating AI-driven portfolio insights and risk scores
 */

export interface PortfolioInsights {
  totalValue: number;
  allocation: Record<string, number>;
  riskScore: number;
  insight: string;
}

export const insightsService = {
  /**
   * Calculate portfolio analytics and generate insights
   */
  async generateInsights(balances: Record<string, number>, prices: Record<string, number>): Promise<PortfolioInsights> {
    let totalValue = 0;
    const allocation: Record<string, number> = {};
    
    // Calculate total value and individual values
    Object.entries(balances).forEach(([symbol, amount]) => {
      const price = prices[symbol] || 0;
      const value = amount * price;
      totalValue += value;
      allocation[symbol] = value;
    });

    // Calculate percentages
    if (totalValue > 0) {
      Object.keys(allocation).forEach(symbol => {
        allocation[symbol] = (allocation[symbol] / totalValue) * 100;
      });
    }

    // Calculate generic risk score (0-100)
    // High ETH concentration = higher risk
    // High USDC = lower risk
    const ethWeight = allocation["ETH"] || 0;
    const riskScore = Math.min(100, Math.round(ethWeight * 0.8 + 10));

    // Generate insight text
    let insight = "";
    if (ethWeight > 70) {
      insight = "Your portfolio is highly exposed to ETH volatility. Consider increasing stablecoin allocation to reduce risk.";
    } else if (ethWeight < 30 && totalValue > 0) {
      insight = "Your portfolio is very conservative. You might be missing out on market upside.";
    } else if (totalValue > 0) {
      insight = "Your portfolio has a balanced allocation between volatile and stable assets.";
    } else {
      insight = "Connect your wallet and add assets to see AI insights.";
    }

    return {
      totalValue,
      allocation,
      riskScore,
      insight
    };
  }
};
