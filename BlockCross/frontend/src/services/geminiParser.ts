// services/geminiParser.ts

export interface ParsedIntent {
    action: "swap" | "buy" | "sell";
    tokenIn: string;
    tokenOut: string;
    amountType: "fixed" | "percentage" | "usd";
    amountValue: number;
}

/**
 * Parses a natural language input into a structured intent using Gemini 2.0 Flash
 * @param userInput string with user's desired swap
 * @returns ParsedIntent showing standard structured instructions
 */
export async function parseIntent(userInput: string): Promise<ParsedIntent> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/api/ai-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCommand: userInput })
    });

    if (!response.ok) {
        throw new Error("Failed to communicate with local Assistant. Ensure backend is running.");
    }

    const data = await response.json();
    if (data.error) {
         throw new Error(data.error);
    }

    return data.parsed_intent;
}
