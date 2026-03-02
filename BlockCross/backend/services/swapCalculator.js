// backend/services/swapCalculator.js

/**
 * Calculate the actual token amount to swap based on parsed intent.
 *
 * @param {Object} parsedIntent - { from_token, to_token, amount_type, amount_value }
 * @param {Object} userBalances  - { ETH: number, USDC: number } (in token units)
 * @param {Object} tokenPrices   - { ETH: number, USDC: number } (USD per token)
 * @returns {{ swapAmount: number, from_token: string, to_token: string }}
 */
export function calculateSwapAmount(parsedIntent, userBalances, tokenPrices) {
    const { from_token, to_token, amount_type, amount_value } = parsedIntent;

    if (!from_token || !to_token) {
        throw new Error("Missing token information in parsed intent.");
    }

    if (from_token === to_token) {
        throw new Error("Cannot swap a token for itself.");
    }

    const balance = userBalances[from_token] ?? 0;
    const price = tokenPrices[from_token] ?? 0;

    let swapAmount;

    switch (amount_type) {
        case "token":
            swapAmount = amount_value;
            break;

        case "percentage": {
            if (amount_value <= 0 || amount_value > 100) {
                throw new Error("Percentage must be between 1 and 100.");
            }
            swapAmount = (balance * amount_value) / 100;
            break;
        }

        case "usd": {
            if (price <= 0) {
                throw new Error(`Cannot determine token price for ${from_token}.`);
            }
            swapAmount = amount_value / price;
            break;
        }

        default:
            throw new Error(`Unknown amount_type: ${amount_type}`);
    }

    // Round to reasonable precision (6 decimals for ETH, 2 for USDC)
    const precision = from_token === "ETH" ? 6 : 2;
    swapAmount = parseFloat(swapAmount.toFixed(precision));

    if (swapAmount <= 0) {
        throw new Error("Calculated swap amount is zero or negative.");
    }

    // Balance validation (only if we have balance info; skip for mock/unconnected)
    if (balance > 0 && swapAmount > balance) {
        throw new Error(
            `Insufficient ${from_token} balance. You have ${balance.toFixed(precision)} but want to swap ${swapAmount.toFixed(precision)}.`
        );
    }

    // Minimum swap checks
    if (from_token === "ETH" && swapAmount < 0.0001) {
        throw new Error("Minimum swap amount is 0.0001 ETH.");
    }

    if (from_token === "USDC" && swapAmount < 1) {
        throw new Error("Minimum swap amount is 1 USDC.");
    }

    return { swapAmount, from_token, to_token };
}

/**
 * Estimate the received amount based on current price (rough estimate before 0x quote).
 */
export function estimateReceived(swapAmount, from_token, to_token, tokenPrices) {
    const fromPrice = tokenPrices[from_token] ?? 0;
    const toPrice = tokenPrices[to_token] ?? 1;

    if (fromPrice <= 0 || toPrice <= 0) return null;

    const usdValue = swapAmount * fromPrice;
    return parseFloat((usdValue / toPrice).toFixed(to_token === "ETH" ? 6 : 2));
}
