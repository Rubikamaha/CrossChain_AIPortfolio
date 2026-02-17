// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import connectDB, { isDBConnected } from "./db.js";
import InsightHistoryModel from "./models/InsightHistory.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Allow all origins for local development to avoid CORS issues
app.use(cors());
app.use(express.json());

// OpenAI Setup
// Initialize with dummy key if missing to prevent startup crash
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
});

// Your Alchemy API Key - works for ALL chains
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "_1DrgpgoYg1fQ2ohpmd8v";

// RPC URL mapping for ALL chains (your key works everywhere)
// Supports Array<string> for fallback rotation
const RPC_URLS = {
  // Mainnets
  "1": [
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth"
  ],
  "137": [
    `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon"
  ],
  "42161": [
    `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://arb1.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum"
  ],
  "10": [
    `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://mainnet.optimism.io",
    "https://rpc.ankr.com/optimism"
  ],
  "8453": [
    `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://mainnet.base.org",
    "https://rpc.ankr.com/base"
  ],
  "43114": [
    `https://avalanche-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://api.avax.network/ext/bc/C/rpc"
  ],
  "56": [
    `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://bsc-dataseed.binance.org"
  ],
  "250": [
    `https://fantom-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "https://rpc.ankr.com/fantom",
    "https://rpcapi.fantom.network",
    "https://fantom-rpc.publicnode.com"
  ],
  // Single URLs (convert to array in logic if needed, but keeping simple here for unused ones)
  "1101": `https://polygonzkevm-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Polygon zkEVM
  "59144": `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,    // Linea
  "534352": `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,  // Scroll
  "11155111": `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,     // Sepolia
  "17000": `https://eth-holesky.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,        // Holesky
  "80002": `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Polygon Amoy
  "97": `https://bnb-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,           // BSC Testnet
  "421614": `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Arbitrum Sepolia
  "11155420": `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,     // Optimism Sepolia
  "84532": `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Base Sepolia
  "43113": `https://avalanche-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Avalanche Fuji
  "324": `https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,        // ZkSync Era
  "81457": `https://blast-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,        // Blast
  "300": `https://zksync-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,        // ZkSync Sepolia
  "168587773": `https://blast-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,   // Blast Sepolia
  "534351": `https://scroll-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`      // Scroll Sepolia
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
      try {
        if (i > 0) console.log(`[Backend] ⚠️ Retrying with fallback URL (${i}): ${safeUrl(url)}`);

        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params
          }),
        });

        if (!resp.ok) {
          // If server error, treat as failure and try next
          const errorText = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${errorText}`);
        }

        data = await resp.json();

        // Check for RPC-level errors that imply sync issues (optional, but good)
        if (data.error && (data.error.code === -32000 || data.error.message?.includes("sync"))) {
          throw new Error(`RPC Sync Error: ${data.error.message}`);
        }

        // If we are here, we succeeded
        success = true;
        if (i > 0) console.log(`[Backend] ✅ Recovered using fallback URL: ${safeUrl(url)}`);
        break;

      } catch (e) {
        console.warn(`[Backend] ❌ Failed to fetch from ${safeUrl(url)}: ${e.message}`);
        lastError = e;
        // Continue to next URL
      }
    }

    if (!success) {
      console.error(`[Backend] ALL RPCs failed for chain ${chainIdStr}`);
      return res.status(503).json({
        error: "All RPC providers failed",
        details: lastError ? lastError.message : "Unknown error",
        chainId
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

// 2. Generate AI Insights (OpenAI) - FINAL ROBUST VERSION
app.post("/api/insights", async (req, res) => {
  try {
    console.log("📊 AI Insights request received");
    const { portfolio, userProfile, network = "mainnet" } = req.body;
    const {
      riskPersonality = 'Balanced',
      learningMode = 'Beginner',
    } = userProfile || {};

    const apiKey = process.env.OPENAI_API_KEY;

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
    const prompt = `
You are a crypto portfolio analysis assistant.

INPUT DATA:
- Network: ${network}
- Risk Profile: ${riskPersonality}
- Portfolio holdings: ${JSON.stringify(portfolio?.balances || [], null, 2)}
- Market Context: ${marketContext}

TASK:
1. Analyze the portfolio risk and diversification.
2. For each token, suggest one action: BUY, SELL, HOLD.
3. Give a confidence score between 0 and 1 for each action.
4. Explain the reason in simple language (no financial jargon).
5. Suggest rebalancing if one asset exceeds 40% of total portfolio.
6. If data is missing, make a conservative assumption and mention it.

RULES:
- Do NOT give financial advice disclaimers.
- Keep explanations short (2–3 lines).
- Prioritize capital safety.
- For testnet, clearly mark results as "Simulated".

OUTPUT FORMAT (JSON):
{
  "summary": "...",
  "portfolio_risk": "Low | Medium | High",
  "actions": [
    {
      "token": "ETH",
      "action": "HOLD",
      "confidence": 0.68,
      "reason": "..."
    }
  ],
  "rebalancing_suggestion": "..."
}
`;

    // 3. AI Execution (or Mock)
    if (!apiKey || apiKey.includes("placeholder")) {
      console.log("⚠️ Using Mock Response");
      return res.json({
        summary: "Portfolio looks balanced. (Mock Data)",
        portfolio_risk: "Medium",
        actions: enrichedAssets.map(a => ({
          token: a.symbol,
          action: "HOLD",
          confidence: 0.8,
          reason: `Holding ${a.symbol} based on ${a.trend} trend.`
        })),
        rebalancing_suggestion: "None needed."
      });
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error("❌ AI Insight Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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

// 6. Parse Swap Command (AI)
app.post("/api/parse-swap", async (req, res) => {
  try {
    const { command, userAddress } = req.body;
    if (!command) return res.status(400).json({ error: "Missing command" });

    const apiKey = process.env.OPENAI_API_KEY;

    // Check for "mock" mode (if key is missing/placeholder)
    if (!apiKey || apiKey.startsWith("sk-placeholder") || apiKey.includes("placeholder")) {
      console.log("⚠️ Using Mock Parser for Swap Command");
      await new Promise(r => setTimeout(r, 1000));

      // Simple regex-based mock parser for demo purposes
      const lowerCmd = command.toLowerCase();
      let amount = "0";
      let tokenIn = "ETH";
      let tokenOut = "USDC"; // Default

      // Extract amount (very basic)
      const amountMatch = lowerCmd.match(/(\d+(\.\d+)?)/);
      if (amountMatch) amount = amountMatch[0];

      // Extract common tokens
      if (lowerCmd.includes("eth")) tokenIn = "ETH";
      if (lowerCmd.includes("usdc")) tokenOut = "USDC";
      if (lowerCmd.includes("dai")) tokenOut = "DAI";
      if (lowerCmd.includes("btc")) tokenOut = "WBTC";
      if (lowerCmd.includes("uni")) tokenOut = "UNI";

      // Check direction
      if (lowerCmd.includes("to eth") || lowerCmd.includes("for eth")) {
        const temp = tokenIn; // Swap logic flip - wait, logic above sets tokenIn='ETH' default
        // If command was "swap 100 USDC for ETH" -> default set tokenIn=ETH, tokenOut=USDC from include checks
        // We need to be smarter.

        // Re-eval for mock
        if (lowerCmd.startsWith("swap eth")) { tokenIn = "ETH"; }
        else if (lowerCmd.includes("usdc")) { tokenIn = "USDC"; tokenOut = "ETH"; }
      }

      return res.json({
        action: "swap",
        amount,
        isPercentage: false, // simplified for mock
        tokenIn: tokenIn.toUpperCase(),
        tokenOut: tokenOut.toUpperCase(),
        confidence: 0.9,
        explanation: `(Mock) I understood you want to swap ${amount} ${tokenIn.toUpperCase()} for ${tokenOut.toUpperCase()}.`
      });
    }

    // Real OpenAI Parser
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

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a precise JSON extractor." }, { role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error("Swap Parse Error:", error);
    res.status(500).json({ error: "Failed to parse swap command" });
  }
});

// 7. AI Rebalancing Analysis
app.post("/api/rebalance/analyze", async (req, res) => {
  try {
    console.log("⚖️ Rebalance Analysis Request");
    const { portfolio, userProfile } = req.body;
    const {
      riskPersonality = 'Balanced',
      marketCondition = 'Neutral'
    } = userProfile || {};

    const apiKey = process.env.OPENAI_API_KEY;

    // --- MOCK / FALLBACK LOGIC ---
    // If no API key, or explicit mock, run local deterministic logic
    if (!apiKey || apiKey.startsWith("sk-placeholder") || apiKey.includes("placeholder")) {
      console.log(`⚠️ Using Mock Rebalancing Logic for ${riskPersonality} profile`);
      await new Promise(r => setTimeout(r, 1500)); // Sim delay

      // 1. Define ideal allocation based on profile
      let targetAllocation = {
        Stablecoins: 0,
        "Large Cap": 0,
        "Mid/Small Cap": 0
      };

      if (riskPersonality === 'Conservative') {
        targetAllocation = { Stablecoins: 50, "Large Cap": 40, "Mid/Small Cap": 10 };
      } else if (riskPersonality === 'Aggressive') {
        targetAllocation = { Stablecoins: 10, "Large Cap": 40, "Mid/Small Cap": 50 };
      } else {
        // Balanced
        targetAllocation = { Stablecoins: 30, "Large Cap": 50, "Mid/Small Cap": 20 };
      }

      // 2. Mock Current Allocation (Randomized slightly for "Drift" effect if portfolio is empty, else roughly calculate)
      // Since we might not have full token categories, we'll simulate a drift scenario where the user is "Too Risky" or "Too Safe"

      const currentAllocation = {
        Stablecoins: 15, // Simulate low stablecoin (risk)
        "Large Cap": 45,
        "Mid/Small Cap": 40
      };

      // 3. Generate Actions to fix drift
      // Example: Sell Small Cap -> Buy Stablecoin
      const actions = [
        {
          id: 1,
          action: "Sell",
          asset: "Small Caps (Index)",
          amount: 1000,
          valueUsd: 1000,
          reason: "Overexposed to high volatility assets."
        },
        {
          id: 2,
          action: "Buy",
          asset: "USDC",
          amount: 1000,
          valueUsd: 1000,
          reason: `Rebalancing to hit ${targetAllocation.Stablecoins}% stablecoin target.`
        }
      ];

      return res.json({
        healthScore: 72,
        riskScore: riskPersonality === 'Aggressive' ? 85 : 45,
        currentAllocation,
        targetAllocation,
        driftDetected: true,
        actions,
        explanation: `Your portfolio is currently drifting towards higher risk than your '${riskPersonality}' profile suggests. We recommend taking profits from small-cap assets and stabilizing with USDC.`
      });
    }

    // --- REAL AI LOGIC ---
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

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error("Rebalance Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze rebalancing needs" });
  }
});



// 8. General AI Chatbot (Web3 Assistant)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // --- MOCK / FALLBACK LOGIC ---
    if (!apiKey || apiKey.startsWith("sk-placeholder") || apiKey.includes("placeholder")) {
      console.log("⚠️ Using Mock Chat Response");
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      let reply = "I'm your Cross-Chain AI assistant. I can help you with bridging, yield optimization, and portfolio strategy. How can I help today?";

      if (lastMessage.includes("yield") || lastMessage.includes("apy")) {
        reply = "Our Smart Yield Optimizer automatically rotates your capital between 5 top DeFi protocols (Aave, Compound, Curve, Uniswap, and Yearn) to capture the highest APY. It checks rates every hour!";
      } else if (lastMessage.includes("bridge")) {
        reply = "We support cross-chain bridging across Ethereum, Polygon, BSC, Avalanche, and Arbitrum. You can move assets seamlessly using our integrated bridge interface.";
      } else if (lastMessage.includes("risk")) {
        reply = "I analyze your token allocation and diversification. By spreading assets across chains, you reduce network-specific risk. Would you like a risk analysis of your current holdings?";
      } else if (lastMessage.includes("gas") || lastMessage.includes("fee")) {
        reply = "Gas fees vary by chain. Typically, Polygon and Arbitrum are much cheaper than Ethereum Mainnet. I recommend checking our gas tracker before large swaps.";
      }

      return res.json({ role: "assistant", content: reply });
    }

    // --- REAL AI LOGIC ---
    const systemPrompt = {
      role: "system",
      content: `You are the "Cross-Chain AI Portfolio Assistant", an expert in Web3, DeFi, and blockchain technology.
      
      Your project, Cross-Chain AI Portfolio, supports five major chains: Ethereum, Polygon, BSC, Avalanche, and Arbitrum.
      
      Key Features of the Project:
      1. Cross-Chain Bridging: Allows moving assets between supported chains.
      2. AI Portfolio Optimization: Analyzes holdings to suggest better risk-adjusted allocations.
      3. Smart Yield Optimizer: A proprietary system that auto-switches capital between 5 DeFi protocols (Aave, Compound, Curve, Uniswap, Yearn) based on the highest APY.
      4. Risk Analysis: Evaluates portfolio concentration and suggests diversification.
      5. Gas Intelligence: Helps users understand fee differences between L1 and L2 chains.
      
      Guidelines:
      - Be professional but friendly. Use crypto-friendly language.
      - Provide beginner-friendly explanations for complex DeFi concepts.
      - When asked about "highest APY" or "yield", mention the 5-protocol auto-switching logic.
      - Keep responses concise and focused on helping the user navigate the platform.`
    };

    const completion = await openai.chat.completions.create({
      messages: [systemPrompt, ...messages],
      model: "gpt-4o-mini",
    });

    res.json(completion.choices[0].message);

  } catch (error) {
    console.error("❌ Chat API Error Details:", {
      message: error.message,
      name: error.name,
      status: error.status,
      data: error.response?.data
    });
    res.status(500).json({
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