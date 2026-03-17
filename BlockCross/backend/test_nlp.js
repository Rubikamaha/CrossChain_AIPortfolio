import { parseIntent } from './services/nlpService.js';

async function test() {
    try {
        const result = await parseIntent("Swap 0.1 ETH to USDC");
        console.log("Success:", result);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
