import fetch from 'node-fetch';

async function testAlchemy() {
    const ALCHEMY_API_KEY = "_1DrgpgoYg1fQ2ohpmd8v"; // from .env

    // Test ethereum
    const url = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    const body = {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [
            '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            'erc20'
        ],
        id: 1
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2).slice(0, 500));
}

testAlchemy();
