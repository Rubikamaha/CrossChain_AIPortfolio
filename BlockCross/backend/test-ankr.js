import fetch from 'node-fetch';

async function testAnkr() {
    const url = 'https://rpc.ankr.com/multichain';
    const body = {
        jsonrpc: '2.0',
        method: 'ankr_getAccountBalance',
        params: {
            walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        },
        id: 1
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

testAnkr();
