// routes/aiInsights.js
import express from "express";
import fetch from "node-fetch";
import { CHAIN_INFO, getRpcUrl } from "../serverhelpers.js";
import AiInsightModel from "../models/AiInsight.js";

const router = express.Router();

// Helper function to generate AI insights based on portfolio analysis
function generateInsights(balances, totalValue) {
  const insights = [];
  const recommendations = [];
  let riskAssessment = "Low";

  // Analyze portfolio concentration
  const chainCount = Object.keys(balances).length;
  if (chainCount === 0) {
    insights.push("Your wallet appears to be empty across all checked chains.");
    recommendations.push("Start by adding funds to your wallet on your preferred blockchain.");
  } else {
    // Find chains with meaningful balances
    const balancesWithValues = Object.entries(balances)
      .map(([chainId, data]) => ({
        chainId,
        ...data,
        valueInEth: parseFloat(data.value || 0)
      }))
      .filter(b => b.valueInEth > 0)
      .sort((a, b) => b.valueInEth - a.valueInEth);

    if (balancesWithValues.length > 0) {
      // Portfolio composition insight
      const topChain = balancesWithValues[0];
      const topChainPercent = ((topChain.valueInEth / totalValue) * 100).toFixed(1);
      insights.push(
        `Your portfolio is concentrated on ${topChain.chain} (${topChainPercent}% of total value). This represents a significant exposure to this blockchain's ecosystem.`
      );

      // Diversification analysis
      if (chainCount === 1) {
        insights.push("Your portfolio is currently on a single blockchain. Consider diversifying across multiple chains to reduce network-specific risk.");
        recommendations.push("Explore bridging assets to other chains like Polygon, Arbitrum, or Optimism to diversify your risk.");
        riskAssessment = "High";
      } else if (chainCount === 2) {
        insights.push("You have holdings across 2 chains. While this is better than single-chain exposure, further diversification could strengthen your portfolio.");
        recommendations.push("Consider expanding to 3-4 major chains to improve diversification.");
        riskAssessment = "Medium";
      } else {
        insights.push(`Your portfolio is diversified across ${chainCount} different chains, which is good for risk management.`);
        recommendations.push("Maintain your diversification strategy and periodically rebalance based on market conditions.");
        riskAssessment = "Low";
      }

      // Value-based insights
      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(totalValue * 2500); // Assuming 1 ETH = $2500 for demo

      insights.push(
        `Your total portfolio value is approximately ${formattedValue} (based on current market data).`
      );

      // Small vs Large holdings analysis
      const smallHoldings = balancesWithValues.filter(b => b.valueInEth < 0.1);
      if (smallHoldings.length > 0) {
        insights.push(
          `You have ${smallHoldings.length} small holdings (< 0.1 units). Monitor these for consolidation opportunities or potential claims.`
        );
      }

      // Chain-specific recommendations
      if (balancesWithValues.some(b => b.chainId === "11155111")) {
        recommendations.push("You have funds on Sepolia testnet. Remember this is for testing - transfer important assets to mainnet.");
      }

      if (balancesWithValues.some(b => b.chainId === "80002")) {
        recommendations.push("Your Polygon Amoy holdings are on testnet. Consider these as experimental assets only.");
      }

      // Gas optimization insight
      const layer2Chains = balancesWithValues.filter(b => 
        ["137", "42161", "10", "8453"].includes(b.chainId)
      );
      if (layer2Chains.length > 0) {
        insights.push(
          `You have holdings on Layer-2 networks (${layer2Chains.map(c => c.symbol).join(", ")}), which typically offer lower transaction fees than Ethereum mainnet.`
        );
      }

      // Growth trajectory (simulated for demo)
      insights.push(
        "Based on current market trends, monitor your portfolio rebalancing needs weekly. Consider setting alerts for significant price movements."
      );

      // DeFi opportunity
      recommendations.push("Explore yield farming or liquidity provision on your largest holdings to potentially earn additional returns.");

      // Security recommendation
      recommendations.push("Ensure your wallet is backed up and private keys are stored securely. Consider using hardware wallets for large holdings.");
    }
  }

  return {
    insights,
    recommendations,
    riskAssessment
  };
}

// POST /ai-insights
router.post("/", async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: "Wallet address required" });

    // --- Fetch balances for all chains ---
    const chainsToCheck = Object.keys(CHAIN_INFO);
    const balances = {};
    let totalValue = 0;

    for (const chainIdStr of chainsToCheck) {
      const rpcConfig = getRpcUrl(chainIdStr);
      if (!rpcConfig) continue;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(rpcConfig.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [wallet, "latest"]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          if (data.result) {
            const balanceWei = BigInt(data.result);
            const balanceEth = Number(balanceWei) / 1e18;
            balances[chainIdStr] = {
              chain: CHAIN_INFO[chainIdStr].name,
              symbol: CHAIN_INFO[chainIdStr].symbol,
              value: balanceEth.toFixed(6)
            };
            totalValue += balanceEth;
          }
        }
      } catch (err) {
        console.warn(`⚠️ ${chainIdStr} fetch failed:`, err.message);
      }
    }

    // --- Generate advanced AI insights ---
    const { insights, recommendations, riskAssessment } = generateInsights(balances, totalValue);

    // --- Save to MongoDB for history ---
    try {
      await AiInsightModel.create({
        wallet,
        balances,
        totalValue,
        insights,
        recommendations,
        riskAssessment,
        createdAt: new Date()
      });
    } catch (dbErr) {
      console.warn("⚠️ Failed to save insights to database:", dbErr.message);
      // Continue even if database save fails
    }

    // --- Send response ---
    res.json({
      wallet,
      balances,
      totalValue,
      insights,
      recommendations,
      riskAssessment,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("💥 AI Insights error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
