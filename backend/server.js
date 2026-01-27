// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

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
const RPC_URLS = {
  // Mainnets
  "1": `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,        // Ethereum
  "137": `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,  // Polygon
  "42161": `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,    // Arbitrum
  "10": `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Optimism
  "8453": `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,    // Base
  "43114": `https://avax-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,   // Avalanche C-Chain
  "56": `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // BSC
  "1101": `https://polygonzkevm-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Polygon zkEVM
  "59144": `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,    // Linea
  "534352": `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,  // Scroll

  // Testnets
  "11155111": `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,     // Sepolia
  "17000": `https://eth-holesky.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,        // Holesky
  "80002": `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Polygon Amoy
  "97": `https://bsc-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,           // BSC Testnet
  "421614": `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Arbitrum Sepolia
  "11155420": `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,     // Optimism Sepolia
  "84532": `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,       // Base Sepolia
  "43113": `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`           // Avalanche Fuji
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
  "43113": { name: "Avalanche Fuji", symbol: "AVAX" }
};

app.post("/rpc", async (req, res) => {
  try {
    const { chainId, method, params = [] } = req.body;

    // Get correct RPC URL for chain
    const chainIdStr = chainId?.toString();
    const rpcUrl = RPC_URLS[chainIdStr];

    if (!rpcUrl) {
      return res.status(400).json({
        error: `Unsupported chain ID: ${chainId}`,
        supported: Object.keys(RPC_URLS)
      });
    }

    console.log(`[Backend] RPC Request: ${method} on chain ${chainIdStr} (${CHAIN_INFO[chainIdStr]?.name || 'Unknown'})`);
    if (params && params.length > 0) console.log(`[Backend] Params:`, params);

    const resp = await fetch(rpcUrl, {
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
      const errorText = await resp.text();
      return res.status(resp.status).json({
        error: `RPC Error: ${resp.status} - ${errorText}`,
        chainId,
        rpcUrl
      });
    }

    const data = await resp.json();
    console.log(`[Backend] Alchemy Response for Chain ${chainIdStr}:`, data);

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
    console.error("RPC Error:", e);
    res.status(500).json({ error: e.message });
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

    // Add API key if available to avoid rate limits
    const options = apiKey ? {
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

// 2. Generate AI Insights (OpenAI)
app.post("/api/insights", async (req, res) => {
  try {
    const { portfolio, userProfile } = req.body;
    const {
      riskPersonality = 'Balanced',
      learningMode = 'Beginner',
      notifications = { highRiskAlert: true, imbalanceAlert: true }
    } = userProfile || {};

    const apiKey = process.env.OPENAI_API_KEY;

    // Check if we should use Mock Data (if key is missing, empty, or placeholder)
    if (!apiKey || apiKey === "sk-placeholder-key-for-development" || apiKey.includes("placeholder")) {
      console.log(`⚠️ No valid OpenAI Key found - Returning MOCK AI response (Tailored for ${riskPersonality} risk, ${learningMode} style)`);

      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockInsight = {
        summary: `[Mock Analysis for ${riskPersonality} Risk Profile] Your portfolio shows a strong leaning towards Layer-2 scaling solutions. While this offers high growth potential, it increases volatility risk. Consider balancing with established Layer-1 assets. (Generated on ${new Date().toISOString()})`,
        healthScore: userProfile?.healthScore || 78,
        riskLevel: riskPersonality === 'Aggressive' ? 'High' : riskPersonality === 'Conservative' ? 'Low' : 'Medium',
        analysis: {
          diversification: "Moderate concentration in ETH-beta assets. Good spread across 3 chains.",
          performance: "Portfolio is outperforming BTC by 5% this week, driven by L2 activity.",
          volatility: notifications.highRiskAlert ? "High volatility detected in smaller cap assets." : "Volatility levels within expected parameters."
        },
        recommendations: [
          {
            type: "Hold",
            asset: "Ethereum (ETH)",
            reason: "Core long-term hold, market dominance remains strong."
          }
        ],
        topPick: {
          asset: "Arbitrum (ARB)",
          reason: "Leading TVL growth and low transaction fees drive strong adoption metrics."
        }
      };

      if (notifications.imbalanceAlert && riskPersonality === 'Conservative') {
        mockInsight.recommendations.push({
          type: "Buy",
          asset: "Stablecoins (USDC)",
          reason: "Increase cash reserves to reduce overall portfolio volatility and rebalance for safety."
        });
      }

      if (notifications.highRiskAlert) {
        mockInsight.recommendations.push({
          type: "Sell",
          asset: "Small Caps",
          reason: "Take profits on recent pumps to reduce risk exposure as per your high-risk alert setting."
        });
      }

      return res.json(mockInsight);
    }

    const prompt = `
      You are an expert crypto portfolio advisor. 
      Analyze this portfolio data:
      ${JSON.stringify(portfolio, null, 2)}

      User Profile:
      - Risk Personality: ${riskPersonality}
      - Learning Mode: ${learningMode}
      - Current Health Score: ${userProfile?.healthScore || 'N/A'}
      - Notification Settings: High-Risk Alerts: ${notifications.highRiskAlert ? 'ON' : 'OFF'}, Imbalance Alerts: ${notifications.imbalanceAlert ? 'ON' : 'OFF'}

      CRITICAL RULES:
      1. ONLY suggest rebalancing or portfolio adjustments if Imbalance Alerts are ON.
      2. ONLY include warnings about volatility or risky assets if High-Risk Alerts are ON.
      3. Tone: Adjust your tone to be ${riskPersonality === 'Conservative' ? 'conservative and cautious' : riskPersonality === 'Aggressive' ? 'bold and growth-oriented' : 'balanced'}.
      4. Detail Level: Provide ${learningMode === 'Expert' ? 'comprehensive and technical' : 'simple and easy to understand'} explanations.
      5. Generation Time: ${new Date().toISOString()}. DO NOT repeat previous generic advice. Provide fresh, data-driven insights based on the current portfolio structure.

      Provide a JSON response with the following structure:
      {
        "summary": "2-3 sentences unique assessment based on date and specific portfolio quirks",
        "healthScore": 0-100 (number),
        "riskLevel": "Low/Medium/High",
        "analysis": {
          "diversification": "Assessment of asset spread",
          "performance": "Review of recent performance",
          "volatility": "Risk assessment based on assets (respect alert toggles)"
        },
        "recommendations": [
          {
            "type": "Buy/Sell/Hold",
            "asset": "Asset Name",
            "reason": "Clear explanation respecting learning mode level"
          }
        ],
        "topPick": {
          "asset": "Name",
          "reason": "Why it looks good"
        }
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini", // Cost effective model
      response_format: { type: "json_object" },
    });

    const insight = JSON.parse(completion.choices[0].message.content);
    res.json(insight);

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate insights" });
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

app.listen(4000, () => {
  console.log("🚀 Multi-chain RPC proxy running at http://localhost:4000");
  console.log("✅ Your key _1DrgpgoYg1fQ2ohpmd8v configured for ALL chains");
  console.log("📋 Check /chains endpoint for supported networks");
});