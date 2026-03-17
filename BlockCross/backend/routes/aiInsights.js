import express from "express";
import fetch from "node-fetch";
import { CHAIN_INFO, getRpcUrl } from "../serverhelpers.js";
import AiInsightModel from "../models/AiInsight.js";

const router = express.Router();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "_1DrgpgoYg1fQ2ohpmd8v"; // fallback to known working for test

const ALCHEMY_NETWORKS = {
  "1": "eth-mainnet",
  "137": "polygon-mainnet",
  "42161": "arb-mainnet",
  "10": "opt-mainnet",
  "8453": "base-mainnet",
  "43114": "avax-mainnet",
  "56": "bnb-mainnet",
  "250": "fantom-mainnet",
  "324": "zksync-mainnet",
  "59144": "linea-mainnet",
  "81457": "blast-mainnet",
  "11155111": "eth-sepolia",
  "80002": "polygon-amoy",
  "97": "bnb-testnet",
  "421614": "arb-sepolia",
  "11155420": "opt-sepolia",
  "84532": "base-sepolia",
  "43113": "avax-fuji",
  "300": "zksync-sepolia",
  "168587773": "blast-sepolia"
};

async function fetchTokenPricesBySymbol(symbolsSet) {
  const cgMap = {
    eth: "ethereum", matic: "matic-network", bnb: "binancecoin",
    avax: "avalanche-2", ftm: "fantom", usdc: "usd-coin",
    usdt: "tether", dai: "dai", weth: "ethereum", wbtc: "wrapped-bitcoin",
    link: "chainlink", uni: "uniswap", shib: "shiba-inu", pepe: "pepe"
  };

  const idsToFetch = Array.from(symbolsSet)
    .map(sym => cgMap[sym.toLowerCase()])
    .filter(Boolean)
    .join(",");

  let pricesUSD = {};
  if (idsToFetch) {
    try {
      const cgResp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch}&vs_currencies=usd`);
      if (cgResp.ok) {
        pricesUSD = await cgResp.json();
      }
    } catch (err) {
      console.warn("CoinGecko fetch failed:", err);
    }
  }

  const fallbacks = {
    ethereum: 2600, "matic-network": 0.5, binancecoin: 600, "avalanche-2": 35,
    fantom: 0.7, "usd-coin": 1, tether: 1, dai: 1, "wrapped-bitcoin": 65000, chainlink: 15
  };

  return { pricesUSD, fallbacks, cgMap };
}

router.post("/", async (req, res) => {
  try {
    const { wallet, insightMode = "market", portfolio } = req.body;
    if (!wallet && !portfolio) return res.status(400).json({ error: "Wallet address or portfolio required" });

    // 1. Fetch balances
    let balances = [];
    let hasTestnet = false;
    const foundSymbols = new Set();

    if (portfolio && portfolio.balances && portfolio.balances.length > 0) {
      balances = portfolio.balances;
      balances.forEach(b => {
        foundSymbols.add(b.symbol);
        if (b.chain && (b.chain.toLowerCase().includes("sepolia") || b.chain.toLowerCase().includes("amoy") || b.chain.toLowerCase().includes("test"))) {
          hasTestnet = true;
        }
      });
    } else {
      const chainsToCheck = Object.keys(CHAIN_INFO);
      const fetchPromises = chainsToCheck.map(async (chainIdStr) => {
      const info = CHAIN_INFO[chainIdStr];
      const isTestnet = info.name.toLowerCase().includes("sepolia") ||
        info.name.toLowerCase().includes("amoy") ||
        info.name.toLowerCase().includes("test");
      if (isTestnet) hasTestnet = true;

      const alchemyNet = ALCHEMY_NETWORKS[chainIdStr];
      if (alchemyNet && ALCHEMY_API_KEY) {
        const alchemyUrl = `https://${alchemyNet}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
        try {
          const nativeRes = await fetch(alchemyUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [wallet, "latest"] })
          });
          const nativeData = await nativeRes.json();
          if (nativeData.result && nativeData.result !== "0x0") {
            const bal = Number(BigInt(nativeData.result)) / 1e18;
            if (bal > 0) {
              balances.push({ chainIdStr, chain: info.name, symbol: info.symbol, value: bal, isNative: true });
              foundSymbols.add(info.symbol);
            }
          }

          const erc20Res = await fetch(alchemyUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "alchemy_getTokenBalances", params: [wallet, "erc20"] })
          });
          const erc20Data = await erc20Res.json();
          if (erc20Data.result && erc20Data.result.tokenBalances) {
            const nonZero = erc20Data.result.tokenBalances.filter(t => t.tokenBalance !== "0x" && parseInt(t.tokenBalance, 16) > 0);

            for (const t of nonZero.slice(0, 5)) {
              const metaRes = await fetch(alchemyUrl, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "alchemy_getTokenMetadata", params: [t.contractAddress] })
              });
              const metaData = await metaRes.json();
              if (metaData.result && metaData.result.symbol) {
                const decimals = metaData.result.decimals || 18;
                const bal = Number(BigInt(t.tokenBalance)) / Math.pow(10, decimals);
                if (bal > 0) {
                  balances.push({ chainIdStr, chain: info.name, symbol: metaData.result.symbol, value: bal, isNative: false });
                  foundSymbols.add(metaData.result.symbol);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`Alchemy fetch failed for ${info.name}:`, e.message);
        }
      } else {
        const rpcConfig = getRpcUrl(chainIdStr);
        if (!rpcConfig) return;
        try {
          const resp = await fetch(rpcConfig.url, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [wallet, "latest"] })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.result && data.result !== "0x0") {
              const bal = Number(BigInt(data.result)) / 1e18;
              if (bal > 0) {
                balances.push({ chainIdStr, chain: info.name, symbol: info.symbol, value: bal, isNative: true });
                foundSymbols.add(info.symbol);
            }
            }
          }
        } catch (e) {
          console.warn(`RPC fetch failed for ${info.name}:`, e.message);
        }
      }
      });

      await Promise.allSettled(fetchPromises);
    }

    if (balances.length === 0) {
      return res.json({ message: "No assets detected to analyze." });
    }

    // 2. Fetch prices & Calculate metrics
    const { pricesUSD, fallbacks, cgMap } = await fetchTokenPricesBySymbol(foundSymbols);
    let totalValueUsd = 0;
    const chainDistributionRaw = {};
    const assetDistributionRaw = {};
    let stablecoinValue = 0;

    const stablecoinSymbols = ["usdc", "usdt", "dai", "fdusd", "frax", "tusd", "usde"];

    for (const data of balances) {
      const cgId = cgMap[data.symbol.toLowerCase()];
      const price = (pricesUSD[cgId] && pricesUSD[cgId].usd) || fallbacks[cgId] || 1;
      const valueUsd = data.value * price;

      data.valueUsd = valueUsd;
      data.priceUsd = price;

      if (valueUsd > 0.01) {
        totalValueUsd += valueUsd;
        chainDistributionRaw[data.chain] = (chainDistributionRaw[data.chain] || 0) + valueUsd;
        assetDistributionRaw[data.symbol] = (assetDistributionRaw[data.symbol] || 0) + valueUsd;

        if (stablecoinSymbols.includes(data.symbol.toLowerCase())) {
          stablecoinValue += valueUsd;
        }
      }
    }

    if (totalValueUsd === 0) {
      return res.json({ message: "No assets detected to analyze." });
    }

    const activeChainsCount = Object.keys(chainDistributionRaw).length;

    let topAssetConcentration = 0;
    const assetDistributionPercentage = {};
    for (const [sym, val] of Object.entries(assetDistributionRaw)) {
      const pct = (val / totalValueUsd) * 100;
      assetDistributionPercentage[sym] = Number(pct.toFixed(2));
      if (pct > topAssetConcentration) topAssetConcentration = pct;
    }

    const chainDistributionPercentage = {};
    for (const [chain, val] of Object.entries(chainDistributionRaw)) {
      chainDistributionPercentage[chain] = Number(((val / totalValueUsd) * 100).toFixed(2));
    }

    const stablecoinRatio = Number(((stablecoinValue / totalValueUsd) * 100).toFixed(2));

    // Volatility exposure heuristic
    let volatilityExposure = "High";
    if (stablecoinRatio > 50) volatilityExposure = "Low";
    else if (stablecoinRatio > 20 || (assetDistributionPercentage["ETH"] || 0) > 40) volatilityExposure = "Medium";

    // Strict Risk Score Formula
    let riskScore = 0;
    if (topAssetConcentration > 70) riskScore += 40;
    if (activeChainsCount < 2) riskScore += 25;
    if (stablecoinRatio < 10) riskScore += 20;
    if (volatilityExposure === "High") riskScore += 15;

    riskScore = Math.min(100, Math.max(0, riskScore));

    const environment = hasTestnet ? "Testnet Simulation" : "Mainnet";

    const aiPayload = {
      environment,
      total_value_usd: Number(totalValueUsd.toFixed(2)),
      active_chains: activeChainsCount,
      chain_distribution: chainDistributionPercentage,
      asset_distribution: assetDistributionPercentage,
      stablecoin_ratio: stablecoinRatio,
      top_asset_concentration: Number(topAssetConcentration.toFixed(2)),
      risk_score: riskScore,
      volatility_exposure_level: volatilityExposure,
      insight_mode: insightMode
    };

    // 4. Local Insights Logic
    const aiParsed = {
      portfolio_summary: `Your portfolio is active across ${activeChainsCount} chains. Total estimated value is $${totalValueUsd.toFixed(2)}.`,
      risk_assessment: `Calculated Risk Score is ${riskScore}/100 with ${volatilityExposure} volatility exposure. Top asset concentration is ${topAssetConcentration.toFixed(2)}%.`,
      diversification_analysis: stablecoinRatio >= 20 ? "Healthy stablecoin reserve cushion." : "Portfolio holds minimal stablecoins, relying heavily on volatile assets.",
      chain_exposure_commentary: activeChainsCount > 1 ? "Assets are distributed across multiple networking environments." : "Assets are heavily concentrated on a single network.",
      optimization_recommendations: topAssetConcentration > 70 ? "Consider rebalancing using the Smart Rebalance tool to reduce isolated asset concentration." : "Maintain current allocations or tune slightly using Smart Rebalance."
    };

    const clientResponse = {
      wallet,
      balances,
      totalValue: totalValueUsd,
      structuredAnalysis: aiParsed,
      analytics: aiPayload,
      timestamp: new Date().toISOString()
    };

    res.json(clientResponse);
  } catch (err) {
    console.error("AI Insights Error:", err);
    res.status(500).json({ error: "Failed to generate AI insights." });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const { portfolio, userProfile } = req.body;
    const { riskPersonality = "Moderate" } = userProfile || {};

    if (!portfolio || !portfolio.balances) {
      return res.status(400).json({ error: "Portfolio data required" });
    }

    // Determine Target Allocations based on Risk
    let targetVolatile = 50; 
    let targetStable = 50;
    if (riskPersonality === "Aggressive") { targetVolatile = 80; targetStable = 20; }
    else if (riskPersonality === "Conservative") { targetVolatile = 20; targetStable = 80; }

    const stablecoinSymbols = ["usdc", "usdt", "dai", "fdusd", "frax", "tusd", "usde"];
    
    let volatileValue = 0;
    let stableValue = 0;
    const currentAllocation = {};

    portfolio.balances.forEach(b => {
      currentAllocation[b.symbol] = (currentAllocation[b.symbol] || 0) + (b.valueUsd || 0);
      if (stablecoinSymbols.includes(b.symbol.toLowerCase())) {
         stableValue += (b.valueUsd || 0);
      } else {
         volatileValue += (b.valueUsd || 0);
      }
    });

    const totalVal = portfolio.totalValue > 0 ? portfolio.totalValue : 1;
    for (const sym of Object.keys(currentAllocation)) {
        currentAllocation[sym] = Number(((currentAllocation[sym] / totalVal) * 100).toFixed(2));
    }

    const currentVolatilePct = (volatileValue / totalVal) * 100;
    const currentStablePct = (stableValue / totalVal) * 100;

    const driftDetected = Math.abs(currentVolatilePct - targetVolatile) > 5;
    const actions = [];

    if (driftDetected) {
       // Super simple heuristic
       if (currentVolatilePct > targetVolatile) {
           const sellAmtUsd = (currentVolatilePct - targetVolatile) / 100 * totalVal;
           actions.push({ id: 1, action: "Sell", asset: "VolatileAssets", amount: "Various", valueUsd: sellAmtUsd.toFixed(2), reason: "Reduce volatile exposure to meet target." });
       } else {
           const buyAmtUsd = (targetVolatile - currentVolatilePct) / 100 * totalVal;
           actions.push({ id: 1, action: "Buy", asset: "VolatileAssets", amount: "Various", valueUsd: buyAmtUsd.toFixed(2), reason: "Increase volatile exposure to meet target." });
       }
    }

    const parsedData = {
      healthScore: driftDetected ? 60 : 95,
      riskScore: currentVolatilePct,
      driftDetected,
      explanation: driftDetected ? `Your portfolio has drifted ${Math.abs(currentVolatilePct - targetVolatile).toFixed(2)}% away from your ${riskPersonality} target.` : "Portfolio is closely aligned with your target risk profile.",
      currentAllocation,
      targetAllocation: { Volatile: targetVolatile, Stable: targetStable },
      actions
    };
    
    res.json(parsedData);

  } catch (err) {
    console.error("Rebalance Analysis Error:", err);
    res.status(500).json({ error: "Analysis Failed", message: err.message || "Failed to analyze rebalancing needs" });
  }
});

export default router;
