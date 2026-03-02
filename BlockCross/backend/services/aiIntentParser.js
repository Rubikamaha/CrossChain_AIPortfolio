// backend/services/aiIntentParser.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const SUPPORTED_TOKENS = ["ETH", "USDC"];

const SYSTEM_PROMPT = `You are an AI swap intent parser.

Supported tokens: ETH, USDC ONLY.

Extract swap details from the user command and return STRICTLY valid JSON with NO markdown formatting, NO explanations.

Return format:
{
  "from_token": "ETH",
  "to_token": "USDC",
  "amount_type": "token | usd | percentage",
  "amount_value": number
}

Rules:
- from_token and to_token must ONLY be "ETH" or "USDC". Never any other token.
- amount_type is "token" when user specifies a token amount (e.g. "0.5 ETH", "Swap 1 ETH")
- amount_type is "usd" when user specifies a dollar amount (e.g. "$500", "1000 dollars worth")
- amount_type is "percentage" when user says "25%", "half", "all" (half = 50, all = 100)
- amount_value is always a plain number (never a string)
- If tokens are unsupported, invalid, or same token → return: {"error": "Invalid swap request"}
- Do NOT include markdown. Do NOT include explanations.`;

let genAI = null;

function getGenAI() {
    if (!genAI && process.env.GOOGLE_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }
    return genAI;
}

export async function parseSwapIntent(userInput) {
    if (!userInput || typeof userInput !== "string" || !userInput.trim()) {
        return { error: "Empty input" };
    }

    const ai = getGenAI();
    if (!ai) {
        return { error: "AI service not configured" };
    }

    try {
        const model = ai.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: { responseMimeType: "application/json" },
        });

        const result = await model.generateContent(userInput.trim());
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (parsed.error) return parsed;

        // Security: enforce token whitelist regardless of AI output
        const fromToken = parsed.from_token?.toUpperCase();
        const toToken = parsed.to_token?.toUpperCase();

        if (!SUPPORTED_TOKENS.includes(fromToken) || !SUPPORTED_TOKENS.includes(toToken)) {
            return { error: `Unsupported token. Only ETH and USDC are supported.` };
        }

        if (fromToken === toToken) {
            return { error: "Cannot swap a token for itself." };
        }

        if (!["token", "usd", "percentage"].includes(parsed.amount_type)) {
            return { error: "Could not determine amount type from your command." };
        }

        if (typeof parsed.amount_value !== "number" || parsed.amount_value <= 0) {
            return { error: "Could not parse a valid amount from your command." };
        }

        return {
            from_token: fromToken,
            to_token: toToken,
            amount_type: parsed.amount_type,
            amount_value: parsed.amount_value,
        };
    } catch (err) {
        console.error("❌ aiIntentParser raw error:", err);

        const statusCode = err.status || (err.response && err.response.status);
        const errMessage = (err.message || "").toString();
        const errString = errMessage + " " + JSON.stringify(err);

        if (statusCode === 429 ||
            errString.includes("429") ||
            errString.toLowerCase().includes("too many requests") ||
            errString.toLowerCase().includes("quota")) {
            return { error: "AI service is currently busy (Rate Limit). Please wait a few seconds and try again." };
        }

        return { error: `Failed to parse swap command: ${errMessage || "Unknown error"}` };
    }
}
