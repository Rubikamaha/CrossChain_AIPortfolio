/**
 * Service for generating AI-driven portfolio insights and risk scores
 */

export interface PortfolioMetrics {
  total_value_usd: number;
  eth_value_usd: number;
  usdc_value_usd: number;
  asset_distribution: {
    eth_percentage: number;
    usdc_percentage: number;
  };
  concentration_risk_score: number;
  volatility_exposure_level: "low" | "medium" | "high";
  portfolio_health_score: number;
  market_trend: "bullish" | "bearish" | "neutral";
}

export const insightsService = {
  /**
   * Calculate mandatory portfolio analytics metrics
   */
  calculateMetrics(balances: Record<string, number>, prices: Record<string, number>): PortfolioMetrics {
    const ethBalance = balances["ETH"] || 0;
    const usdcBalance = balances["USDC"] || 0;
    
    const ethPrice = prices["ETH"] || 0;
    const usdcPrice = prices["USDC"] || 1;

    const ethValueUsd = ethBalance * ethPrice;
    const usdcValueUsd = usdcBalance * usdcPrice;
    const totalValueUsd = ethValueUsd + usdcValueUsd;

    let ethPercentage = 0;
    let usdcPercentage = 0;

    if (totalValueUsd > 0) {
      ethPercentage = (ethValueUsd / totalValueUsd) * 100;
      usdcPercentage = (usdcValueUsd / totalValueUsd) * 100;
    }

    // Concentration risk: high if >70% in one asset
    const concentrationRiskScore = Math.max(ethPercentage, usdcPercentage);
    
    // Volatility: ETH is volatile, USDC is stable
    let volatilityLevel: "low" | "medium" | "high" = "low";
    if (ethPercentage > 70) volatilityLevel = "high";
    else if (ethPercentage > 30) volatilityLevel = "medium";

    // Health Score: 100 - (abs(50 - ethPercentage) * 2) 
    // Ideally 50/50 for highest health in this specific logic
    const diversificationBonus = Math.max(0, 100 - Math.abs(50 - ethPercentage) * 2);
    const healthScore = totalValueUsd > 0 ? diversificationBonus : 0;

    // Market Trend: Simple mock trend for now (bullish if ETH is > 2000)
    const marketTrend: "bullish" | "bearish" | "neutral" = ethPrice > 2000 ? "bullish" : "neutral";

    return {
      total_value_usd: totalValueUsd,
      eth_value_usd: ethValueUsd,
      usdc_value_usd: usdcValueUsd,
      asset_distribution: {
        eth_percentage: Number(ethPercentage.toFixed(2)),
        usdc_percentage: Number(usdcPercentage.toFixed(2))
      },
      concentration_risk_score: Number(concentrationRiskScore.toFixed(2)),
      volatility_exposure_level: volatilityLevel,
      portfolio_health_score: Math.round(healthScore),
      market_trend: marketTrend
    };
  }
};

