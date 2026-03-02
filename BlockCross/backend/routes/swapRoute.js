// backend/routes/swapRoute.js
import express from "express";
import fetch from "node-fetch";
import { parseSwapIntent } from "../services/aiIntentParser.js";
import { calculateSwapAmount } from "../services/swapCalculator.js";
import { getSwapQuote, getMockQuote } from "../services/swapService.js";

const router = express.Router();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "_1DrgpgoYg1fQ2ohpmd8v";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || "";

// Cache prices briefly (90 seconds)
let priceCache = { data: null, ts: 0 };

async function fetchTokenPrices() {
    const now = Date.now();
    if (priceCache.data && now - priceCache.ts < 90_000) return priceCache.data;

    try {
        const headers = COINGECKO_API_KEY
            ? { "x-cg-demo-api-key": COINGECKO_API_KEY }
            : {};
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd",
            { headers }
        );
        const data = await res.json();
        const prices = {
            ETH: data?.ethereum?.usd || 0,
            USDC: data?.["usd-coin"]?.usd || 1,
        };
        priceCache = { data: prices, ts: now };
        return prices;
    } catch {
        return { ETH: 0, USDC: 1 };
    }
}

async function fetchETHBalance(address) {
    if (!address || address === "0x0000000000000000000000000000000000000000") return 0;
    try {
        const res = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_getBalance",
                params: [address, "latest"],
            }),
        });
        const data = await res.json();
        if (data.result) {
            return parseInt(data.result, 16) / 1e18;
        }
        return 0;
    } catch {
        return 0;
    }
}

async function fetchUSDCBalance(address) {
    if (!address || address === "0x0000000000000000000000000000000000000000") return 0;
    try {
        const USDC_CONTRACT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        // balanceOf(address) = 0x70a08231 + padded address
        const paddedAddr = address.toLowerCase().replace("0x", "").padStart(64, "0");
        const data = `0x70a08231${paddedAddr}`;

        const res = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_call",
                params: [{ to: USDC_CONTRACT, data }, "latest"],
            }),
        });
        const json = await res.json();
        if (json.result && json.result !== "0x") {
            return parseInt(json.result, 16) / 1e6; // USDC has 6 decimals
        }
        return 0;
    } catch {
        return 0;
    }
}

// POST /api/ai-swap
router.post("/api/ai-swap", async (req, res) => {
    try {
        const { userCommand, userAddress } = req.body;

        if (!userCommand || !userCommand.trim()) {
            return res.status(400).json({ error: "userCommand is required." });
        }

        console.log(`🤖 AI Swap request: "${userCommand}" from ${userAddress || "anonymous"}`);

        // Step 1: Parse intent with Gemini AI
        const parsedIntent = await parseSwapIntent(userCommand);
        if (parsedIntent.error) {
            return res.status(400).json({
                error: parsedIntent.error,
                stage: "intent_parsing",
            });
        }
        console.log("✅ Parsed intent:", parsedIntent);

        // Step 2: Fetch token prices
        const tokenPrices = await fetchTokenPrices();
        console.log("💰 Token prices:", tokenPrices);

        // Step 3: Fetch user balances (if address provided)
        let userBalances = { ETH: 0, USDC: 0 };
        const isRealAddress =
            userAddress &&
            userAddress !== "0x0000000000000000000000000000000000000000";

        if (isRealAddress) {
            const [ethBal, usdcBal] = await Promise.all([
                fetchETHBalance(userAddress),
                fetchUSDCBalance(userAddress),
            ]);
            userBalances = { ETH: ethBal, USDC: usdcBal };
            console.log("👛 Balances:", userBalances);
        }

        // Step 4: Calculate swap amount
        let calcResult;
        try {
            calcResult = calculateSwapAmount(parsedIntent, userBalances, tokenPrices);
        } catch (calcError) {
            return res.status(400).json({
                error: calcError.message,
                stage: "calculation",
                parsed_intent: parsedIntent,
            });
        }
        console.log("🔢 Calculated:", calcResult);

        // Step 5: Get swap quote from 0x (with mock fallback)
        let quote;
        let usedMock = false;
        try {
            quote = await getSwapQuote(
                calcResult.from_token,
                calcResult.to_token,
                calcResult.swapAmount,
                isRealAddress ? userAddress : null
            );
        } catch (quoteErr) {
            console.warn("⚠️ 0x quote failed, using mock fallback:", quoteErr.message);
            quote = getMockQuote(
                calcResult.from_token,
                calcResult.to_token,
                calcResult.swapAmount,
                tokenPrices
            );
            usedMock = true;
        }

        // Step 6: Return structured response
        return res.json({
            success: true,
            is_mock: usedMock,
            parsed_intent: parsedIntent,
            user_balances: userBalances,
            token_prices: tokenPrices,
            swap_amount: calcResult.swapAmount,
            from_token: calcResult.from_token,
            to_token: calcResult.to_token,
            expected_receive: quote.buy_amount,
            price: quote.price,
            guaranteed_price: quote.guaranteed_price,
            price_impact: quote.price_impact,
            gas_estimate: quote.gas_estimate,
            gas_estimate_eth: quote.gas_estimate_eth,
            allowance_target: quote.allowance_target,
            tx_data: quote.tx_data,
            sources: quote.sources,
            slippage: "1%",
        });
    } catch (err) {
        console.error("❌ /api/ai-swap error:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
});

export default router;
