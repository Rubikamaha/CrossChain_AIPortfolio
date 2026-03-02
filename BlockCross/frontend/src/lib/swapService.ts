// frontend/src/lib/swapService.ts

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface AISwapQuote {
    success: boolean;
    is_mock: boolean;
    parsed_intent: {
        from_token: string;
        to_token: string;
        amount_type: string;
        amount_value: number;
    };
    user_balances: {
        ETH: number;
        USDC: number;
    };
    token_prices: {
        ETH: number;
        USDC: number;
    };
    swap_amount: number;
    from_token: string;
    to_token: string;
    expected_receive: number;
    price: number;
    guaranteed_price: number;
    price_impact: number | null;
    gas_estimate: string | null;
    gas_estimate_eth: number | null;
    allowance_target: string | null;
    tx_data: {
        to: string;
        data: string;
        value: string;
        gas: string | null;
        gasPrice: string | null;
    } | null;
    sources: { name: string; proportion: number }[];
    slippage: string;
    error?: string;
}

/**
 * Call the backend to parse the natural language command and fetch a 0x quote.
 */
export async function getAISwapQuote(command: string, address: string | null): Promise<AISwapQuote> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/ai-swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userCommand: command,
                userAddress: address || "0x0000000000000000000000000000000000000000"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch swap quote');
        }

        return data;
    } catch (e: any) {
        console.error('AI Swap Quote Error:', e);
        throw e;
    }
}

/**
 * Execute the swap by sending the transaction through the browser wallet.
 */
export async function executeSwap(txData: AISwapQuote['tx_data'], signerAddress: string) {
    if (!window.ethereum) throw new Error("No browser wallet found");
    if (!txData) throw new Error("No transaction data provided");

    console.log("🚀 Executing Swap Transaction:", txData);

    const txParams = {
        from: signerAddress,
        to: txData.to,
        data: txData.data,
        value: '0x' + BigInt(txData.value).toString(16),
    };

    // Note: If swapping a token (USDC), an approval might be needed.
    // In a production app, we would check allowance here.
    // For this implementation, we'll assume the 0x quote handled logic 
    // and the user may need to approve if they haven't before.

    try {
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [txParams]
        });

        return txHash as string;
    } catch (error: any) {
        console.error("Execution error:", error);
        throw new Error(error.message || "User rejected or execution failed");
    }
}

/**
 * Helper to format price for display
 */
export function formatPrice(price: number, from: string, to: string) {
    if (price > 1) {
        return `1 ${from} = ${price.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to}`;
    } else {
        const inv = 1 / price;
        return `1 ${to} = ${inv.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${from}`;
    }
}
