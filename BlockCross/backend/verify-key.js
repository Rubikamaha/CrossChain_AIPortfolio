import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function verifyKey() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("❌ No GOOGLE_API_KEY found in .env");
        return;
    }

    console.log(`🔍 Testing key starting with: ${key.substring(0, 6)}...`);

    try {
        const genAI = new GoogleGenerativeAI(key);

        // Test basic connectivity by listing models
        console.log("Listing available models...");
        // Note: listModels is not directly on genAI in all SDK versions, 
        // but the error message suggested checking model list.
        // We will try to just use 'gemini-1.5-flash' again but with a simpler call 
        // or try 'gemini-pro' (1.0) as fallback.

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log("✅ Key is VALID!");
        console.log("Response:", response.text());
    } catch (error) {
        console.error("❌ Key verification FAILED:");
        if (error.status === 404) {
            console.error("Error 404: The model name 'gemini-2.0-flash' was not found. Your key might be restricted or you might need to use a different model name.");
        }
        console.error(error.message || error);
        if (error.stack) console.error(error.stack);
    }
}

verifyKey();
