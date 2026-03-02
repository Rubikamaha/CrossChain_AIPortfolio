import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function inspectError() {
    const key = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        await model.generateContent("Hi");
    } catch (error) {
        console.log("Error status:", error.status);
        console.log("Error statusText:", error.statusText);
        console.log("Error keys:", Object.keys(error));
        console.log("Error stringified:", JSON.stringify(error, null, 2));
        console.log("Error message:", error.message);
    }
}

inspectError();
