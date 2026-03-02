import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        if (data.models) {
            const fs = await import('fs');
            fs.writeFileSync('model_list.txt', data.models.map(m => m.name).join('\n'));
            console.log("Wrote models to model_list.txt");
        } else {
            console.log("No models found:", data);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
listModels();
