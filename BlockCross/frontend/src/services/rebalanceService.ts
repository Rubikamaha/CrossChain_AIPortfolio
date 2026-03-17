/**
 * Service to calculate rebalancing trades
 */

export interface RebalancePlan {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  requiredSwaps: Array<{
    action: "BUY" | "SELL";
    asset: string;
    amountUsd: number;
    amountToken: number;
  }>;
}

export const rebalanceService = {
  /**
   * Compute a rebalance plan based on targets
   */
  calculatePlan(
    balances: Record<string, number>,
    prices: Record<string, number>,
    targetAllocation: Record<string, number> // e.g., { ETH: 50, USDC: 50 }
  ): RebalancePlan {
    const totalValue = Object.entries(balances).reduce((acc, [sym, amt]) => {
      return acc + (amt * (prices[sym] || 0));
    }, 0);

    const currentAllocation: Record<string, number> = {};
    const requiredSwaps: RebalancePlan["requiredSwaps"] = [];

    if (totalValue <= 0) {
      return { currentAllocation: {}, targetAllocation, requiredSwaps: [] };
    }

    Object.entries(balances).forEach(([sym, amt]) => {
      const val = amt * (prices[sym] || 0);
      currentAllocation[sym] = (val / totalValue) * 100;
      
      const targetPct = targetAllocation[sym] || 0;
      const targetVal = (targetPct / 100) * totalValue;
      const diffVal = targetVal - val;

      if (Math.abs(diffVal) > 10) { // Threshold $10
        const action = diffVal > 0 ? "BUY" : "SELL";
        const price = prices[sym] || 1;
        requiredSwaps.push({
          action,
          asset: sym,
          amountUsd: Math.abs(diffVal),
          amountToken: Math.abs(diffVal) / price
        });
      }
    });

    return {
      currentAllocation,
      targetAllocation,
      requiredSwaps
    };
  }
};
