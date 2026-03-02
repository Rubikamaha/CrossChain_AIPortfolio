import fetch from 'node-fetch';

async function testInsights() {
    const payload = {
        portfolio: { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", balances: [{ symbol: "ETH", balance: "10.5", usdValue: 30000 }] },
        userProfile: { insightMode: "Risk Mode" },
        network: "mainnet"
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
