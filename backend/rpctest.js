import fetch from "node-fetch";

const RPC_URLS = {
  "1": "https://eth-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "137": "https://polygon-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "42161": "https://arb-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "10": "https://opt-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "8453": "https://base-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "43114": "https://avalanche-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "56": "https://bnb-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "1101": "https://polygonzkevm-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "59144": "https://linea-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "534352": "https://scroll-mainnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "11155111": "https://eth-sepolia.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "17000": "https://eth-holesky.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "80002": "https://polygon-amoy.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "97": "https://bnb-testnet.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "421614": "https://arb-sepolia.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "11155420": "https://opt-sepolia.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "84532": "https://base-sepolia.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v",
  "43113": "https://avalanche-fuji.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v"
};

async function testChain(id, url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return { id, status: 'FAILED', error: `HTTP ${response.status}: ${text.substring(0, 100)}` };
    }

    const data = await response.json();
    if (data.error) {
      return { id, status: 'FAILED', error: data.error.message };
    }

    return { id, status: 'OK', result: data.result };
  } catch (error) {
    return { id, status: 'ERROR', error: error.message };
  }
}

async function runTests() {
  console.log("Starting RPC Connectivity Tests...");
  const results = await Promise.all(
    Object.entries(RPC_URLS).map(([id, url]) => testChain(id, url))
  );

  console.table(results);

  const failed = results.filter(r => r.status !== 'OK');
  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} tests failed!`);
    process.exit(1);
  } else {
    console.log("\n✅ All RPC endpoints are reachable and functional!");
  }
}

runTests();
