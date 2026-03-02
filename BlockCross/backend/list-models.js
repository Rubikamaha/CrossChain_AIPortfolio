import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("❌ No GOOGLE_API_KEY found in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        // The SDK doesn't have a direct listModels, we have to use the REST API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ Error listing models:", data.error.message);
            return;
        }

        console.log("Available Models:");
        data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }
}

listModels();
