import dotenv from "dotenv";
dotenv.config();

async function rawTest() {
    const key = process.env.GOOGLE_API_KEY;
    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hi" }] }]
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        if (data.candidates) {
            console.log("Response:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("Error Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
rawTest();
