import fetch from 'node-fetch';

async function testAlchemyBalances() {
    const ALCHEMY_API_KEY = "_1DrgpgoYg1fQ2ohpmd8v"; // from .env

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
    const nonZero = data.result.tokenBalances.filter(t => t.tokenBalance !== '0x' && t.tokenBalance !== '0x0' && t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000');

    console.log("Found", nonZero.length, "non-zero tokens");

    if (nonZero.length > 0) {
        const metadataBody = {
            jsonrpc: '2.0',
            method: 'alchemy_getTokenMetadata',
            params: [nonZero[0].contractAddress],
            id: 2
        };
        const metadataRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadataBody)
        });
        const metadataData = await metadataRes.json();
        console.log("Metadata of first:", metadataData.result);
    }
}

testAlchemyBalances();
