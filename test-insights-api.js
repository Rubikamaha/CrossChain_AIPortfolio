import fetch from 'node-fetch';

async function testInsights() {
    const payload = {
        wallet: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
        insightMode: "Risk Mode"
    };

    console.log("Testing POST http://localhost:4000/api/insights ...");
    const response = await fetch('http://localhost:4000/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
}

testInsights().catch(console.error);
