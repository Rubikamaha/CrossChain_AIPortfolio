// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import connectDB, { isDBConnected } from "./db.js";
import InsightHistoryModel from "./models/InsightHistory.js";
import swapRoute from "./routes/swapRoute.js";
import aiInsightsRoute from "./routes/aiInsights.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Allow all origins for local development to avoid CORS issues
app.use(cors());
app.use(express.json());

// Register routes
app.use(swapRoute);
app.use("/api/rebalance", aiInsightsRoute);
app.use("/api/insights", aiInsightsRoute);

// Gemini Setup
const genAI = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

// Your Alchemy API Key - works for ALL chains
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "_1DrgpgoYg1fQ2ohpmd8v";

// RPC URL mapping for ALL chains (your key works everywhere)
// Supports Array<string> for fallback rotation
const RPC_URLS = {
  // Mainnets
  "1": [
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://1rpc.io/eth"
  ],
  "137": [
    `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://1rpc.io/poly"
  ],
  "42161": [
    `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://arb1.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum",
    "https://1rpc.io/arb"
  ],
  "10": [
    `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://mainnet.optimism.io",
    "https://rpc.ankr.com/optimism",
    "https://1rpc.io/op"
  ],
  "8453": [
    `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://mainnet.base.org",
    "https://rpc.ankr.com/base",
    "https://1rpc.io/base"
  ],
  "43114": [
    `https://avalanche-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche"
  ],
  "56": [
    `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc"
  ],
  "250": [
    `https://fantom-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://rpc.ankr.com/fantom",
    "https://rpcapi.fantom.network",
    "https://fantom-rpc.publicnode.com"
  ],
  // Testnets & Others
  "1101": [
    `https://polygonzkevm-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://zkevm-rpc.com"
  ],
  "59144": [
    `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://rpc.linea.build"
  ],
  "534352": [
    `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://rpc.scroll.io"
  ],
  "11155111": [
    `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://eth-sepolia.public.blastapi.io",
    "https://rpc.ankr.com/eth_sepolia"
  ],
  "17000": [
    `https://eth-holesky.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://ethereum-holesky-rpc.publicnode.com"
  ],
  "80002": [
    `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://rpc-amoy.polygon.technology"
  ],
  "97": [
    `https://bnb-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://data-seed-prebsc-1-s1.binance.org:8545"
  ],
  "421614": [
    `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://sepolia-rollup.arbitrum.io/rpc"
  ],
  "11155420": [
    `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://sepolia.optimism.io"
  ],
  "84532": [
    `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://sepolia.base.org"
  ],
  "43113": [
    `https://avalanche-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://api.avax-test.network/ext/bc/C/rpc"
  ],
  "324": [
    `https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://mainnet.era.zksync.io"
  ],
  "81457": [
    `https://blast-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://rpc.blast.io"
  ],
  "300": [
    `https://zksync-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://sepolia.era.zksync.dev"
  ],
  "168587773": [
    `https://blast-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://sepolia.blast.io"
  ],
  "534351": [
    `https://scroll-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://sepolia-rpc.scroll.io"
  ]
};

// Chain info for balance responses
const CHAIN_INFO = {
  "1": { name: "Ethereum", symbol: "ETH" },
  "137": { name: "Polygon", symbol: "MATIC" },
  "42161": { name: "Arbitrum", symbol: "ETH" },
  "10": { name: "Optimism", symbol: "ETH" },
  "8453": { name: "Base", symbol: "ETH" },
  "43114": { name: "Avalanche", symbol: "AVAX" },
  "56": { name: "BSC", symbol: "BNB" },
  "1101": { name: "Polygon zkEVM", symbol: "ETH" },
  "59144": { name: "Linea", symbol: "ETH" },
  "534352": { name: "Scroll", symbol: "ETH" },
  "11155111": { name: "Sepolia", symbol: "ETH" },
  "17000": { name: "Holesky", symbol: "ETH" },
  "80002": { name: "Polygon Amoy", symbol: "MATIC" },
  "97": { name: "BSC Testnet", symbol: "BNB" },
  "421614": { name: "Arbitrum Sepolia", symbol: "ETH" },
  "11155420": { name: "Optimism Sepolia", symbol: "ETH" },
  "84532": { name: "Base Sepolia", symbol: "ETH" },
  "43113": { name: "Avalanche Fuji", symbol: "AVAX" },
  "250": { name: "Fantom", symbol: "FTM" },
  "324": { name: "ZkSync Era", symbol: "ETH" },
  "81457": { name: "Blast", symbol: "ETH" },
  "300": { name: "ZkSync Sepolia", symbol: "ETH" },
  "168587773": { name: "Blast Sepolia", symbol: "ETH" },
  "534351": { name: "Scroll Sepolia", symbol: "ETH" }
};

const COINGECKO_CACHE = new Map();
const CACHE_TTL_PRICE = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_HISTORY = 60 * 60 * 1000; // 60 minutes

// Simple Map for common tokens (In a real app, this would be more extensive or dynamic)
const COIN_ID_MAP = {
  "ETH": "ethereum",
  "WETH": "ethereum",
  "BTC": "bitcoin",
  "WBTC": "bitcoin",
  "MATIC": "matic-network",
  "USDC": "usd-coin",
  "USDT": "tether",
  "DAI": "dai",
  "SOL": "solana",
  "AVAX": "avalanche-2",
  "LINK": "chainlink",
  "UNI": "uniswap",
  "AAVE": "aave",
  "BNB": "binancecoin",
  "ARB": "arbitrum",
  "OP": "optimism"
};

// --- CoinGecko Helper Functions ---

async function fetchCoinGeckoPrice(symbol) {
  const coinId = COIN_ID_MAP[symbol.toUpperCase()];
  if (!coinId) return null;

  const cacheKey = `price_${coinId}`;
  const now = Date.now();

  if (COINGECKO_CACHE.has(cacheKey)) {
    const cached = COINGECKO_CACHE.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_PRICE) {
      return cached.data;
    }
  }

  try {
    console.log(`🦎 Fetching Price for ${coinId}...`);
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24h_change=true&include_market_cap=true&include_24h_vol=true`);
    const data = await res.json();

    if (data[coinId]) {
      const result = {
        price: data[coinId].usd,
        change24h: data[coinId].usd_24h_change,
        marketCap: data[coinId].usd_market_cap,
        volume24h: data[coinId].usd_24h_vol
      };
      COINGECKO_CACHE.set(cacheKey, { timestamp: now, data: result });
      return result;
    }
  } catch (error) {
    console.error(`❌ CoinGecko Price Fetch Error (${coinId}):`, error.message);
  }
  return null;
}

async function fetchCoinGeckoHistory(symbol, days = 30) {
  const coinId = COIN_ID_MAP[symbol.toUpperCase()];
  if (!coinId) return null;

  const cacheKey = `history_${coinId}_${days}`;
  const now = Date.now();

  if (COINGECKO_CACHE.has(cacheKey)) {
    const cached = COINGECKO_CACHE.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_HISTORY) {
      return cached.data;
    }
  }

  try {
    console.log(`🦎 Fetching History for ${coinId} (${days}d)...`);
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`);
    const data = await res.json();

    if (data.prices) {
      const prices = data.prices.map(p => p[1]); // Extract prices only
      COINGECKO_CACHE.set(cacheKey, { timestamp: now, data: prices });
      return prices;
    }
  } catch (error) {
    console.error(`❌ CoinGecko History Fetch Error (${coinId}):`, error.message);
  }
  return null;
}

function calculateVolatility(prices) {
  if (!prices || prices.length < 2) return "Unknown";

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const volatility = (stdDev / mean) * 100; // Coeff of variation as %

  if (volatility < 2) return "Low";
  if (volatility < 5) return "Medium";
  return "High";
}

function analyzeTrend(prices) {
  if (!prices || prices.length < 2) return "Unknown";

  const start = prices[0];
  const end = prices[prices.length - 1];
  const change = ((end - start) / start) * 100;

  if (change > 5) return "Upward 📈";
  if (change < -5) return "Downward 📉";
  return "Sideways ➡️";
}

app.post("/rpc", async (req, res) => {
  try {
    const { chainId, method, params = [] } = req.body;

    // Get correct RPC URL(s) for chain
    const chainIdStr = chainId?.toString();
    const rpcConfig = RPC_URLS[chainIdStr];

    if (!rpcConfig) {
      return res.status(400).json({
        error: `Unsupported chain ID: ${chainId}`,
        supported: Object.keys(RPC_URLS)
      });
    }

    // Normalize to array for rotation
    const rpcUrls = Array.isArray(rpcConfig) ? rpcConfig : [rpcConfig];

    // Helper to mask key for logging
    const safeUrl = (url) => url.replace(ALCHEMY_API_KEY, 'API_KEY');

    console.log(`[Backend] RPC Request: ${method} on chain ${chainIdStr} (${CHAIN_INFO[chainIdStr]?.name || 'Unknown'})`);
    if (params && params.length > 0) console.log(`[Backend] Params:`, params);

    let lastError = null;
    let success = false;
    let data = null;

    // --- FALLBACK LOOP ---
    for (let i = 0; i < rpcUrls.length; i++) {
      const url = rpcUrls[i];

      // CRITICAL: Skip non-Alchemy URLs for Alchemy-specific "Enhanced API" methods
      if (method.startsWith("alchemy_") && !url.includes("alchemy.com")) {
        continue;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        if (i > 0) console.log(`[Backend] ⚠️ Retrying with fallback URL (${i}): ${safeUrl(url)}`);

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params
          }),
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          const errorText = await resp.text();
          // If it's a 4xx error from Alchemy for an enhanced API, it usually means unsupported on this chain
          if (resp.status >= 400 && resp.status < 500 && method.startsWith("alchemy_")) {
            console.warn(`[Backend] Alchemy Enhanced API ${method} likely unsupported on chain ${chainIdStr} (HTTP ${resp.status})`);
            break; // Stop trying other fallbacks for this specific method
          }
          throw new Error(`HTTP ${resp.status}: ${errorText}`);
        }

        data = await resp.json();

        // Specific handling for "Method not found" or "Unsupported" errors from the RPC itself
        if (data.error && (data.error.code === -32601 || data.error.message?.toLowerCase().includes("not supported"))) {
          if (method.startsWith("alchemy_")) {
            console.warn(`[Backend] Method ${method} not supported by this Alchemy endpoint for chain ${chainIdStr}`);
            break;
          }
        }

        if (data.error && (data.error.code === -32000 || data.error.message?.includes("sync"))) {
          throw new Error(`RPC Sync Error: ${data.error.message}`);
        }

        success = true;
        if (i > 0) console.log(`[Backend] ✅ Recovered using fallback URL: ${safeUrl(url)}`);
        break;

      } catch (e) {
        clearTimeout(timeoutId);
        const errorMsg = e.name === 'AbortError' ? 'Request Timeout (5s)' : e.message;
        console.warn(`[Backend] ❌ Failed to fetch from ${safeUrl(url)}: ${errorMsg}`);
        lastError = new Error(errorMsg);
      }
    }

    if (!success) {
      // If an Alchemy-specific method failed on all allowed providers, return a neutral result
      if (method.startsWith("alchemy_")) {
        console.warn(`[Backend] ⚠️ Returning neutral empty result for unsupported Alchemy method: ${method}`);
        let neutralResult = { jsonrpc: "2.0", id: 1, result: null };

        if (method === "alchemy_getTokenBalances") {
          neutralResult.result = { address: params[0] || "0x", tokenBalances: [] };
        } else if (method === "alchemy_getTokenMetadata") {
          neutralResult.result = { symbol: "Unknown", decimals: 18, logo: null, name: "Unknown" };
        }

        return res.json(neutralResult);
      }

      console.error(`[Backend] ALL RPCs failed for chain ${chainIdStr}`);
      return res.status(503).json({
        error: "All RPC providers failed",
        details: lastError ? lastError.message : "Unknown error",
        chainId,
        method
      });
    }

    if (data.error) {
      console.error(`[Backend] Alchemy/RPC Error:`, data.error);
    } else {
      console.log(`[Backend] Success for ${method} on chain ${chainIdStr}`);
    }

    // Format balance responses
    if (method === "eth_getBalance" && data.result) {
      const balanceWei = BigInt(data.result);
      const chainInfo = CHAIN_INFO[chainIdStr];
      data.result_formatted = {
        wei: data.result,
        value: (Number(balanceWei) / 1e18).toFixed(6),
        symbol: chainInfo?.symbol || "ETH",
        chain: chainInfo?.name || "Unknown",
        raw: data.result
      };
    }

    res.json(data);
  } catch (e) {
    console.error("RPC Request Failure:", e);
    res.status(500).json({
      error: "RPC Proxy Exception",
      message: e.message,
      code: e.code,
      chainId: req.body?.chainId
    });
  }
});

// --- NEW ENDPOINTS ---

// 1. Get Token Prices (CoinGecko)
app.get("/api/prices", async (req, res) => {
  try {
    const { ids } = req.query; // e.g., "ethereum,bitcoin,matic-network"
    if (!ids) return res.status(400).json({ error: "Missing 'ids' query parameter" });

    const apiKey = process.env.COINGECKO_API_KEY;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    // Use API key if available and NOT a placeholder
    const isPlaceholder = !apiKey || apiKey.includes("your_coingecko_key") || apiKey === "";
    const options = !isPlaceholder ? {
      headers: { "x-cg-demo-api-key": apiKey }
    } : {};

    const response = await fetch(url, options);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Price fetch error:", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// 2. Generate AI Insights (Gemini)
app.post("/api/insights", async (req, res) => {
  try {
    console.log("📊 AI Insights request received");
    const { portfolio, userProfile, network = "mainnet" } = req.body;
    const {
      riskPersonality = 'Balanced',
      learningMode = 'Beginner',
    } = userProfile || {};

    if (!genAI) {
      return res.status(503).json({ error: "Google API key not configured" });
    }

    // 1. Fetch Market Data (Safe Wrapper)
    let marketContext = "Market Data Unavailable";
    let enrichedAssets = [];

    if (portfolio?.balances) {
      console.log("🔍 Fetching market data...");
      const symbols = [...new Set(portfolio.balances.map(b => b.symbol).filter(s => s && s !== 'ETH'))];
      if (portfolio.balances.find(b => b.symbol === 'ETH')) symbols.push('ETH');

      const marketResults = await Promise.all(symbols.map(async (symbol) => {
        try {
          const priceData = await fetchCoinGeckoPrice(symbol);
          const historyData = await fetchCoinGeckoHistory(symbol, 30);
          return { symbol, price: priceData?.price, trend: analyzeTrend(historyData) };
        } catch (e) {
          return null;
        }
      }));

      enrichedAssets = marketResults.filter(r => r !== null);
      if (enrichedAssets.length > 0) {
        marketContext = enrichedAssets.map(a => `${a.symbol}: $${a.price} (${a.trend})`).join(", ");
      }
    }

    // 2. Construct Prompt
    const totalValueUsd = portfolio?.balances?.reduce((sum, b) => sum + (b.usdValue || 0), 0) || 0;
    const insightMode = req.body.userProfile?.insightMode || 'Market Mode';

    const prompt = `
You are an expert crypto portfolio analysis agent.

INPUT DATA:
- Network: ${network}
- Risk Profile: ${riskPersonality}
- Portfolio holdings: ${JSON.stringify(portfolio?.balances || [], null, 2)}
- Market Context: ${marketContext}
- Insight Mode: ${insightMode}

TASK:
Provide a detailed portfolio analysis in the EXACT JSON structure requested below.
Determine the correct distribution percentages (must sum to 100) and an appropriate risk score (0-100).
For testnet or simulated data, mark the environment as "Testnet Simulation".

OUTPUT FORMAT (Valid JSON Only):
{
  "wallet": "${portfolio?.address || 'unknown'}",
  "totalValue": ${totalValueUsd},
  "structuredAnalysis": {
      "portfolio_summary": "1-2 sentence overall summary.",
      "risk_assessment": "Explain the current risk profile.",
      "diversification_analysis": "Analyze asset and chain spread.",
      "chain_exposure_commentary": "Thoughts on the chain allocation.",
      "optimization_recommendations": "Actionable next steps. Use BUY/SELL/HOLD language."
  },
  "analytics": {
      "environment": "${network === 'mainnet' ? 'Mainnet' : 'Testnet Simulation'}",
      "total_value_usd": ${totalValueUsd},
      "active_chains": 1,
      "chain_distribution": { "Ethereum": 100 },
      "asset_distribution": { "ETH": 100 },
      "stablecoin_ratio": 0,
      "top_asset_concentration": 100,
      "risk_score": 50,
      "volatility_exposure_level": "Medium",
      "insight_mode": "${insightMode}"
  }
}
`;

    console.log("🚀 Using Gemini for Insights");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const completion = await model.generateContent(prompt);
    const response = await completion.response;
    const text = response.text();
    res.json(JSON.parse(text));

  } catch (error) {
    console.error("❌ AI Insight Error:", error);

    let status = error.status || 500;
    const errorString = String(error?.message || "") + " " + JSON.stringify(error);

    if (errorString.includes("429") || errorString.toLowerCase().includes("too many requests") || errorString.toLowerCase().includes("quota")) {
      status = 429;
    }

    // Auto-fallback for rate limit to prevent UI breakage
    if (status === 429) {
      console.log("⚠️ Rate limit hit. Sending mock fallback data.");
      return res.status(200).json({
        wallet: portfolio?.address || 'unknown',
        totalValue: portfolio?.balances?.reduce((sum, b) => sum + (b.usdValue || 0), 0) || 0,
        structuredAnalysis: {
          portfolio_summary: "The AI API is currently rate limited. This is a simulated fallback summary. Your portfolio is being tracked successfully.",
          risk_assessment: "Unable to process full risk due to API limits. Defaulting to Moderate.",
          diversification_analysis: "Simulation: Assets appear appropriately diversified for current market conditions.",
          chain_exposure_commentary: "Simulation: Chain exposure is standard.",
          optimization_recommendations: "Please try generating insights again in a minute when the API rate limit resets."
        },
        analytics: {
          environment: "API Rate Limited (Fallback)",
          total_value_usd: portfolio?.balances?.reduce((sum, b) => sum + (b.usdValue || 0), 0) || 0,
          active_chains: 1,
          chain_distribution: { "Fallback": 100 },
          asset_distribution: { "Fallback": 100 },
          stablecoin_ratio: 0,
          top_asset_concentration: 100,
          risk_score: 50,
          volatility_exposure_level: "Medium",
          insight_mode: "Fallback Mode"
        }
      });
    }

    res.status(status).json({
      error: status === 429 ? "Rate Limit Exceeded" : "Internal Server Error",
      details: status === 429 ? "The AI API is currently receiving too many requests. Please try again in a minute." : error.message
    });
  }
});

// --- HISTORICAL INSIGHTS ENDPOINTS ---

// 1. Save insight to history
app.post("/api/insights/save", async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        error: "Database not available",
        message: "Historical features are currently disabled"
      });
    }

    const { walletAddress, analysis, portfolioSnapshot, marketContext } = req.body;

    if (!walletAddress || !analysis || !portfolioSnapshot) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["walletAddress", "analysis", "portfolioSnapshot"]
      });
    }

    const insight = new InsightHistoryModel({
      walletAddress: walletAddress.toLowerCase(),
      portfolioSnapshot,
      analysis: {
        healthScore: analysis.healthScore,
        riskLevel: analysis.riskLevel,
        summary: analysis.summary,
        diversification: analysis.analysis?.diversification,
        performance: analysis.analysis?.performance,
        volatility: analysis.analysis?.volatility
      },
      recommendations: analysis.recommendations || [],
      topPick: analysis.topPick,
      predictions: analysis.predictions,
      anomalies: analysis.anomalies,
      rebalancing: analysis.rebalancing,
      userProfile: analysis.userProfile,
      marketContext: marketContext || {}
    });

    await insight.save();
    console.log(`💾 Saved insight for wallet ${walletAddress.substring(0, 10)}...`);

    res.json({
      success: true,
      insightId: insight._id,
      timestamp: insight.timestamp
    });

  } catch (error) {
    console.error("❌ Error saving insight:", error);
    res.status(500).json({
      error: "Failed to save insight",
      details: error.message
    });
  }
});

// 2. Get historical insights for a wallet
app.get("/api/insights/history/:walletAddress", async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        error: "Database not available",
        insights: [],
        total: 0
      });
    }

    const { walletAddress } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    let query = { walletAddress: walletAddress.toLowerCase() };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const insights = await InsightHistoryModel.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await InsightHistoryModel.countDocuments(query);

    res.json({
      insights,
      total,
      hasMore: (offset + limit) < total,
      limit,
      offset
    });

  } catch (error) {
    console.error("❌ Error fetching history:", error);
    res.status(500).json({
      error: "Failed to fetch history",
      details: error.message
    });
  }
});

// 3. Get trend data for charts
app.get("/api/insights/trends/:walletAddress", async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        error: "Database not available",
        healthScoreTrend: [],
        riskTrend: [],
        valueTrend: [],
        timestamps: []
      });
    }

    const { walletAddress } = req.params;
    const days = parseInt(req.query.days) || 30;

    const trendData = await InsightHistoryModel.getTrendData(walletAddress, days);

    const healthScoreTrend = trendData.map(d => d.analysis.healthScore);
    const riskTrend = trendData.map(d => d.analysis.riskLevel);
    const valueTrend = trendData.map(d => d.portfolioSnapshot.totalValue);
    const timestamps = trendData.map(d => d.timestamp);

    res.json({
      healthScoreTrend,
      riskTrend,
      valueTrend,
      timestamps,
      dataPoints: trendData.length
    });

  } catch (error) {
    console.error("❌ Error fetching trends:", error);
    res.status(500).json({
      error: "Failed to fetch trends",
      details: error.message
    });
  }
});

// 4. Compare current vs previous insight
app.get("/api/insights/compare/:walletAddress", async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        error: "Database not available",
        current: null,
        previous: null
      });
    }

    const { walletAddress } = req.params;

    const insights = await InsightHistoryModel.find({
      walletAddress: walletAddress.toLowerCase()
    })
      .sort({ timestamp: -1 })
      .limit(2)
      .lean();

    if (insights.length === 0) {
      return res.json({
        current: null,
        previous: null,
        changes: null,
        message: "No historical data available"
      });
    }

    const current = insights[0];
    const previous = insights[1] || null;

    let changes = null;
    if (previous) {
      changes = {
        healthScore: current.analysis.healthScore - previous.analysis.healthScore,
        riskLevel: current.analysis.riskLevel !== previous.analysis.riskLevel
          ? `${previous.analysis.riskLevel} → ${current.analysis.riskLevel}`
          : 'No change',
        totalValue: current.portfolioSnapshot.totalValue - previous.portfolioSnapshot.totalValue,
        totalValuePercent: ((current.portfolioSnapshot.totalValue - previous.portfolioSnapshot.totalValue) / previous.portfolioSnapshot.totalValue * 100).toFixed(2),
        timeDiff: Math.floor((current.timestamp - previous.timestamp) / (1000 * 60 * 60)) // hours
      };
    }

    res.json({
      current,
      previous,
      changes
    });

  } catch (error) {
    console.error("❌ Error comparing insights:", error);
    res.status(500).json({
      error: "Failed to compare insights",
      details: error.message
    });
  }
});

// 5. Get insight statistics for a wallet
app.get("/api/insights/stats/:walletAddress", async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        error: "Database not available"
      });
    }

    const { walletAddress } = req.params;
    const address = walletAddress.toLowerCase();

    const totalInsights = await InsightHistoryModel.countForWallet(address);
    const latest = await InsightHistoryModel.getLatest(address);

    // Get average health score
    const avgHealthScore = await InsightHistoryModel.aggregate([
      { $match: { walletAddress: address } },
      {
        $group: {
          _id: null,
          avgHealth: { $avg: "$analysis.healthScore" },
          maxHealth: { $max: "$analysis.healthScore" },
          minHealth: { $min: "$analysis.healthScore" }
        }
      }
    ]);

    res.json({
      totalInsights,
      latestInsight: latest,
      averageHealthScore: avgHealthScore[0]?.avgHealth || 0,
      maxHealthScore: avgHealthScore[0]?.maxHealth || 0,
      minHealthScore: avgHealthScore[0]?.minHealth || 0,
      firstInsightDate: latest ? (await InsightHistoryModel.findOne({ walletAddress: address }).sort({ timestamp: 1 }).lean())?.timestamp : null
    });

  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: error.message
    });
  }
});

// List all supported chains
app.get("/chains", (req, res) => {
  res.json({
    supportedChains: Object.entries(CHAIN_INFO).map(([id, info]) => ({
      chainId: parseInt(id),
      name: info.name,
      symbol: info.symbol,
      rpcUrl: RPC_URLS[id]
    }))
  });
});

// 6. Parse Swap Command (Gemini)
app.post("/api/parse-swap", async (req, res) => {
  try {
    const { command, userAddress } = req.body;
    if (!command) return res.status(400).json({ error: "Missing command" });

    if (!genAI) {
      return res.status(503).json({ error: "Google API key not configured" });
    }

    const prompt = `
      You are a DeFi execution agent. Parser the following user command into a structured JSON swap intent.
      
      User Command: "${command}"
      
      Extract:
      - action: "swap" (or "unknown" if not a swap)
      - amount: number (0 if "all" or unspecified, but try to extract)
      - isPercentage: boolean (true if user said "50%", "half", "all")
      - percentage: number (e.g. 50 for 50%, 100 for all)
      - tokenIn: symbol (e.g. ETH, USDC)
      - tokenOut: symbol
      - balanceCheckRequired: boolean (true if user says "half my eth" or "all tokens")
      - condition: string (optional, e.g. "when price > 2000")
      
      Response Format (JSON only):
      {
        "action": "swap",
        "amount": 10.5,
        "isPercentage": false,
        "percentage": 0,
        "tokenIn": "ETH",
        "tokenOut": "USDC",
        "balanceCheckRequired": false,
        "explanation": "Brief confirmation message to user"
      }
    `;

    console.log("🚀 Using Gemini for Swap Parsing");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const completion = await model.generateContent(prompt);
    const response = await completion.response;
    res.json(JSON.parse(response.text()));

  } catch (error) {
    console.error("Swap Parse Error:", error);
    res.status(error.status || 500).json({
      error: "Failed to parse swap command",
      details: error.message
    });
  }
});

// 7. AI Rebalancing Analysis (Gemini)
app.post("/api/rebalance/analyze", async (req, res) => {
  try {
    console.log("⚖️ Rebalance Analysis Request");
    const { portfolio, userProfile } = req.body;
    const {
      riskPersonality = 'Balanced',
      marketCondition = 'Neutral'
    } = userProfile || {};

    if (!genAI) {
      return res.status(503).json({ error: "Google API key not configured" });
    }

    const prompt = `
      You are an expert Portfolio Manager AI.
      User Profile: ${riskPersonality}
      Market Condition: ${marketCondition}
      
      Portfolio Data:
      ${JSON.stringify(portfolio, null, 2)}

      Task:
      1. Determine the Current Allocation (Categorize assets into Stablecoins, Large Cap, Mid/Small Cap).
      2. Define the Target Allocation for a ${riskPersonality} investor in a ${marketCondition} market.
      3. Identify Drift (Difference > 5%).
      4. Suggest specific SWAP actions to rebalance.
      
      Output JSON:
      {
        "healthScore": 0-100,
        "riskScore": 0-100,
        "currentAllocation": { "Stablecoins": %, "Large Cap": %, "Mid/Small Cap": % },
        "targetAllocation": { "Stablecoins": %, "Large Cap": %, "Mid/Small Cap": % },
        "driftDetected": boolean,
        "actions": [
          {
            "id": number,
            "action": "Buy" | "Sell",
            "asset": "Token Symbol",
            "amount": number,
            "valueUsd": number,
            "reason": "Why this swap?"
          }
        ],
        "explanation": "Simple English summary of why rebalancing is needed."
      }
    `;

    console.log("🚀 Using Gemini for Rebalance Analysis");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const completion = await model.generateContent(prompt);
    const response = await completion.response;
    res.json(JSON.parse(response.text()));

  } catch (error) {
    console.error("Rebalance Analysis Error:", error);
    res.status(error.status || 500).json({
      error: "Failed to analyze rebalancing needs",
      details: error.message
    });
  }
});



// 8. General AI Chatbot (Gemini)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    if (!genAI) {
      return res.status(503).json({ error: "Google API key not configured" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are the "Cross-Chain AI Portfolio Assistant", an expert in Web3, DeFi, and blockchain technology.
    
    Your project, Cross-Chain AI Portfolio, supports five major chains: Ethereum, Polygon, BSC, Avalanche, and Arbitrum.
    
    Key Features of the Project:
    1. Cross-Chain Bridging: Allows moving assets between supported chains.
    2. AI Portfolio Optimization: Analyzes holdings to suggest better risk-adjusted allocations.
    3. Smart Yield Optimizer: A proprietary system that auto-switches capital between 5 DeFi protocols (Aave, Compound, Curve, Uniswap, Yearn) based on the highest APY.
    4. Risk Analysis: Evaluates portfolio concentration and suggests diversification.
    5. Gas Intelligence: Helps users understand fee differences between L1 and L2 chains.`
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    res.json({ role: "assistant", content: result.response.text() });

  } catch (error) {
    console.error("❌ Chat API Error:", error);
    res.status(error.status || 500).json({
      error: "Failed to process chat request",
      details: error.message
    });
  }
});

app.listen(4000, () => {
  console.log("🚀 Multi-chain RPC proxy running at http://localhost:4000");
  console.log("✅ Your key _1DrgpgoYg1fQ2ohpmd8v configured for ALL chains");
  console.log("📋 Check /chains endpoint for supported networks");
});
