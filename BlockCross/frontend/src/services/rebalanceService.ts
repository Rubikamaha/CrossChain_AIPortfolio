/**
 * Service to calculate asset-based rebalancing trades (cross-chain)
 */

export interface AssetInput {
  token: string;
  chains: string[];
  balance: number;
  price: number;
  value_usd: number;
}

export interface RebalanceAsset {
  token: string;
  percentage: number;
  target_percentage: number;
  drift: number;
  action: "BUY" | "SELL" | "HOLD";
  value_to_adjust: number;
  token_amount: number;
}

export interface RebalanceResult {
  health_score: number;
  assets: RebalanceAsset[];
  total_value: number;
}

export const rebalanceService = {
  /**
   * Compute a rebalance plan based on target strategy
   */
  calculateRebalance(assets: AssetInput[], customTargets?: Record<string, number>): RebalanceResult {
    const totalValue = assets.reduce((acc, a) => acc + a.value_usd, 0);
    
    if (totalValue <= 0) {
      return { health_score: 0, assets: [], total_value: 0 };
    }

    // Target Strategy map
    const targets: Record<string, number> = {
      "ETH": 40,
      "USDC": 40,
      ...customTargets
    };

    let totalDrift = 0;
    const rebalanceAssets: RebalanceAsset[] = assets.map(asset => {
      const currentPct = (asset.value_usd / totalValue) * 100;
      
      const targetPct = targets[asset.token] || 0;
      const drift = currentPct - targetPct;
      totalDrift += Math.abs(drift);

      let action: "BUY" | "SELL" | "HOLD" = "HOLD";
      if (drift > 10) action = "SELL";
      else if (drift < -10) action = "BUY";

      const valueToAdjust = (drift / 100) * totalValue;
      const tokenAmount = Math.abs(valueToAdjust) / asset.price;

      return {
        token: asset.token,
        percentage: Number(currentPct.toFixed(2)),
        target_percentage: targetPct,
        drift: Number(drift.toFixed(2)),
        action,
        value_to_adjust: Number(valueToAdjust.toFixed(2)),
        token_amount: Number(tokenAmount.toFixed(6))
      };
    });

    const healthScore = Math.max(0, 100 - totalDrift);

    return {
      health_score: Math.round(healthScore),
      assets: rebalanceAssets,
      total_value: totalValue
    };
  }
};

