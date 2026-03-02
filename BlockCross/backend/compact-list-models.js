import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        if (data.models) {
            console.log(data.models.map(m => m.name).join(", "));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
listModels();
