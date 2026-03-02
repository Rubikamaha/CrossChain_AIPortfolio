// backend/services/swapService.js
// Fetches a swap quote from 0x Swap API v1. Does NOT execute the swap.

import fetch from "node-fetch";

// 0x API endpoint (v1, no API key required for basic quotes)
const ZEROX_API_URL = "https://api.0x.org/swap/v1/quote";
const ZEROX_API_KEY = process.env.ZEROX_API_KEY || "";

// Token address mapping for Ethereum Mainnet
const TOKEN_ADDRESSES = {
    ETH: "ETH",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum mainnet
};

// How many decimal places each token uses
const TOKEN_DECIMALS = {
    ETH: 18,
    USDC: 6,
};

/**
 * Convert a human-readable token amount to its base unit string (integer).
 */
function toBaseUnit(amount, token) {
    const decimals = TOKEN_DECIMALS[token] ?? 18;
    // Use BigInt arithmetic to avoid floating point errors
    const factor = BigInt(10) ** BigInt(decimals);
    const whole = BigInt(Math.floor(amount));
    const frac = amount - Math.floor(amount);
    const fracStr = frac.toFixed(decimals).slice(2); // digits after decimal
    const fracInt = BigInt(fracStr);
    return (whole * factor + fracInt).toString();
}

/**
 * Convert a base-unit amount (string) to human-readable number.
 */
function fromBaseUnit(amountStr, token) {
    const decimals = TOKEN_DECIMALS[token] ?? 18;
    const amount = BigInt(amountStr);
    const factor = BigInt(10) ** BigInt(decimals);
    const whole = amount / factor;
    const remainder = amount % factor;
    const fracStr = remainder.toString().padStart(decimals, "0").slice(0, 6);
    return parseFloat(`${whole}.${fracStr}`);
}

/**
 * Fetch a swap quote from 0x Protocol.
 * @param {string} fromToken - "ETH" or "USDC"
 * @param {string} toToken - "ETH" or "USDC"
 * @param {number} swapAmount - human-readable amount to sell
 * @param {string} [takerAddress] - optional wallet address for accurate quotes
 * @returns {Promise<Object>} quote details
 */
export async function getSwapQuote(fromToken, toToken, swapAmount, takerAddress = null) {
    const sellToken = TOKEN_ADDRESSES[fromToken];
    const buyToken = TOKEN_ADDRESSES[toToken];

    if (!sellToken || !buyToken) {
        throw new Error(`Unsupported token: ${fromToken} or ${toToken}`);
    }

    const sellAmount = toBaseUnit(swapAmount, fromToken);

    const params = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage: "0.01", // 1% slippage limit
    });

    if (takerAddress) {
        params.append("takerAddress", takerAddress);
    }

    const headers = { "Content-Type": "application/json" };
    if (ZEROX_API_KEY) {
        headers["0x-api-key"] = ZEROX_API_KEY;
    }

    console.log(`🔄 Fetching 0x quote: ${fromToken} → ${toToken} | Amount: ${swapAmount}`);

    const res = await fetch(`${ZEROX_API_URL}?${params}`, { headers });

    if (!res.ok) {
        const errText = await res.text();
        let errJson;
        try { errJson = JSON.parse(errText); } catch { errJson = { reason: errText }; }

        // 0x returns verbose validation errors — simplify
        const reason = errJson?.validationErrors?.[0]?.reason || errJson?.reason || errText;
        throw new Error(`0x API Error (${res.status}): ${reason}`);
    }

    const data = await res.json();

    const buyAmountHuman = fromBaseUnit(data.buyAmount, toToken);
    const gasEstimateETH = data.estimatedGas
        ? parseFloat((parseInt(data.estimatedGas) * 30e9 / 1e18).toFixed(6))
        : null;

    return {
        from_token: fromToken,
        to_token: toToken,
        sell_amount: swapAmount,
        buy_amount: buyAmountHuman,
        buy_amount_raw: data.buyAmount,
        price: parseFloat(data.price),
        guaranteed_price: parseFloat(data.guaranteedPrice),
        gas_estimate: data.estimatedGas || null,
        gas_estimate_eth: gasEstimateETH,
        price_impact: data.estimatedPriceImpact
            ? parseFloat(data.estimatedPriceImpact)
            : null,
        allowance_target: data.allowanceTarget || null,
        tx_data: {
            to: data.to,
            data: data.data,
            value: data.value || "0",
            gas: data.gas || null,
            gasPrice: data.gasPrice || null,
        },
        sources: data.sources
            ?.filter((s) => parseFloat(s.proportion) > 0)
            .map((s) => ({ name: s.name, proportion: parseFloat(s.proportion) })),
    };
}

/**
 * Fallback: generate a simulated quote when 0x is unavailable (e.g., no mainnet wallet).
 */
export function getMockQuote(fromToken, toToken, swapAmount, tokenPrices) {
    const fromPrice = tokenPrices[fromToken] ?? 0;
    const toPrice = tokenPrices[toToken] ?? 1;
    const usdValue = swapAmount * fromPrice;
    const buyAmount = parseFloat((usdValue / toPrice).toFixed(toToken === "ETH" ? 6 : 2));
    const price = fromPrice / toPrice;

    return {
        from_token: fromToken,
        to_token: toToken,
        sell_amount: swapAmount,
        buy_amount: buyAmount,
        buy_amount_raw: null,
        price: parseFloat(price.toFixed(6)),
        guaranteed_price: parseFloat((price * 0.99).toFixed(6)), // 1% slippage
        gas_estimate: "150000",
        gas_estimate_eth: 0.004,
        price_impact: 0.1,
        allowance_target: null,
        tx_data: null,
        sources: [{ name: "Simulated (Mock)", proportion: 1 }],
        is_mock: true,
    };
}
