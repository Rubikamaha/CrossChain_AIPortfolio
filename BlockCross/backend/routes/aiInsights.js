import express from "express";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHAIN_INFO, getRpcUrl } from "../serverhelpers.js";
import AiInsightModel from "../models/AiInsight.js";

const router = express.Router();

let genAI;
if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
}

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
    const { wallet, insightMode = "market" } = req.body;
    if (!wallet) return res.status(400).json({ error: "Wallet address required" });

    // 1. Fetch balances
    const chainsToCheck = Object.keys(CHAIN_INFO);
    const balances = [];
    let hasTestnet = false;
    const foundSymbols = new Set();

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

    // 4. Call Gemini
    if (!genAI) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    const systemPrompt = `You are a professional cross-chain crypto portfolio advisor.

Analyze ONLY based on the structured portfolio data provided.
Do not assume missing data.
Do not hallucinate prices or assets.
Do not invent data.
Base insights strictly on allocation percentages, risk score, and diversification metrics.

Return output strictly in valid JSON format.
Do NOT include markdown.
Do NOT include explanations outside JSON.

Return this EXACT structure:
{
  "portfolio_summary": "string",
  "risk_assessment": "string",
  "diversification_analysis": "string",
  "chain_exposure_commentary": "string",
  "optimization_recommendations": "string"
}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: "application/json" }
    });

    const aiRes = await model.generateContent(JSON.stringify(aiPayload));
    let aiText = aiRes.response.text().trim();
    if (aiText.startsWith('\`\`\`json')) aiText = aiText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();

    let aiParsed;
    try {
      aiParsed = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI output:", aiText);
      throw new Error("Invalid AI output format");
    }

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

    // 1. Prepare data for AI
    const portfolioSummary = portfolio.balances.map(b =>
      `${b.symbol}: ${b.value} (${b.chain}) - $${b.valueUsd?.toFixed(2) || 0}`
    ).join("\n");

    const systemPrompt = `You are a cross-chain portfolio rebalancing AI. 
Analyze the user's portfolio against their ${riskPersonality} risk profile.
Identify if the portfolio has drifted from the target allocation for ${riskPersonality}.

Return output STRICTLY in valid JSON format.
JSON Structure:
{
  "healthScore": number (0-100),
  "riskScore": number (0-100),
  "driftDetected": boolean,
  "explanation": "Detailed professional explanation",
  "currentAllocation": { "Symbol": percentage },
  "targetAllocation": { "Symbol": percentage },
  "actions": [
    { "id": 1, "action": "Buy"|"Sell", "asset": "Symbol", "amount": "0.1", "valueUsd": 100, "reason": "why" }
  ]
}

Target Allocations for ${riskPersonality}:
- Aggressive: 80% Volatile (ETH/SOL/BNB), 20% Stable
- Moderate: 50% Volatile, 50% Stable
- Conservative: 20% Volatile, 80% Stable`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Portfolio:\n${portfolioSummary}\nTotal Value: $${portfolio.totalValue}\nRisk: ${riskPersonality}`;
    const aiRes = await model.generateContent(prompt);

    let aiText = aiRes.response.text().trim();
    if (aiText.startsWith('\`\`\`json')) aiText = aiText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();

    res.json(JSON.parse(aiText));
  } catch (err) {
    console.error("Rebalance Analysis Error:", err);
    res.status(500).json({ error: "Failed to analyze rebalancing needs" });
  }
});

export default router;
