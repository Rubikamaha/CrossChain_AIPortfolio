// backend/test-ai-swap.js
import fetch from "node-fetch";

async function testWithRetry(command, address = null, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch('http://localhost:4000/api/ai-swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userCommand: command, userAddress: address || "0x000000000000000000000000000000000000dead" })
            });

            const data = await res.json();

            if (data.error && data.error.includes("Rate Limit")) {
                console.log(`⚠️ Rate limit hit (attempt ${i + 1}/${maxRetries}). Retrying in 15s...`);
                await new Promise(r => setTimeout(r, 15000));
                continue;
            }

            return { status: res.status, data };
        } catch (e) {
            console.error('Fetch error:', e.message);
            return null;
        }
    }
}

async function runTests() {
    console.log('--- Testing ETH to USDC ---');
    const res1 = await testWithRetry('Swap 0.1 ETH to USDC');
    if (res1) {
        console.log('Status:', res1.status);
        const data = res1.data;
        if (data.success) {
            console.log('✅ From:', data.from_token, 'To:', data.to_token, 'Amount:', data.swap_amount);
            console.log('Expected:', data.expected_receive);
            console.log('Mock:', data.is_mock);
        } else {
            console.log('❌ Error:', data.error);
        }
    }

    console.log('\n--- Testing Invalid Token ---');
    const res2 = await testWithRetry('Swap 100 PEPE to ETH');
    if (res2) {
        console.log('Status:', res2.status);
        console.log('Error Message:', res2.data.error);
    }
}

runTests();
