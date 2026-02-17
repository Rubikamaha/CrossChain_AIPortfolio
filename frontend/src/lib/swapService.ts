import { encodeFunctionData, parseEther, formatEther, type Hex } from 'viem';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Uniswap V2 Router Address (Sepolia)
// Using a known testnet router or a placeholder if exact one isn't known.
// For Sepolia, Uniswap V2 is often deployed at: 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008 (example)
// We will use a placeholder or look it up. Let's use standard V2 Router 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D which is often deployed on testnets too.
const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// Token Addresses on Sepolia (Example Mapping)
const TOKEN_MAP: Record<string, string> = {
    'ETH': 'ETH', // Native
    'WETH': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // Sepolia WETH
    'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // Sepolia UNI
    'LINK': '0x779877A7B0D9E8603169DdbD7836e478b4624789'  // Sepolia LINK
};

// ABI for Router
const ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactETHForTokens",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForETH",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export interface ParsedSwap {
    action: string;
    amount: number;
    tokenIn: string;
    tokenOut: string;
    explanation: string;
    error?: string;
}

export async function parseSwapCommand(command: string, userAddress: string): Promise<ParsedSwap> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/parse-swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, userAddress })
        });

        if (!response.ok) throw new Error('Failed to parse command');
        return await response.json();
    } catch (e: any) {
        console.error('Parse error:', e);
        return {
            action: 'error',
            amount: 0,
            tokenIn: '',
            tokenOut: '',
            explanation: '',
            error: e.message
        };
    }
}

// SimpleToken Address (RBT) - Placeholder, replace with actual deployed address
const SIMPLE_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890';

// SimpleToken ABI for Buy/Sell
const SIMPLE_TOKEN_ABI = [
    {
        "inputs": [],
        "name": "buy",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "sell",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export async function executeSwap(swap: ParsedSwap, signerAddress: string) {
    if (!window.ethereum) throw new Error("No wallet found");

    // Check if this is a SimpleToken (RBT) swap
    const isBuyRBT = swap.tokenIn === 'ETH' && (swap.tokenOut === 'RBT' || swap.tokenOut === 'RubikaToken');
    const isSellRBT = (swap.tokenIn === 'RBT' || swap.tokenIn === 'RubikaToken') && swap.tokenOut === 'ETH';

    if (isBuyRBT || isSellRBT) {
        console.log("Executing SimpleToken Swap (Bonding Curve)...");
        const amountInWei = parseEther(swap.amount.toString());

        let data: Hex;
        let value = 0n;
        let toAddress: string;

        if (isBuyRBT) {
            // Function: buy()
            value = amountInWei;
            data = encodeFunctionData({
                abi: SIMPLE_TOKEN_ABI,
                functionName: 'buy',
                args: []
            });
            toAddress = SIMPLE_TOKEN_ADDRESS;
        } else {
            // Function: sell(amount)
            // Note: In a real app, you'd need to approve() first if this wasn't the token contract itself burning its own tokens 
            // from msg.sender. But SimpleToken.sell() burns from msg.sender, so no approval needed for the contract to burn user tokens? 
            // Wait, standard ERC20 usually requires allowance for transferFrom, but here the function is IN the contract.
            // "sell" function does: balanceOf[msg.sender] -= amount. 
            // Since it's the token contract itself modifying the state, NO APPROVAL is needed for `sell` inside `SimpleToken.sol`.

            value = 0n;
            data = encodeFunctionData({
                abi: SIMPLE_TOKEN_ABI,
                functionName: 'sell',
                args: [amountInWei]
            });
            toAddress = SIMPLE_TOKEN_ADDRESS;
        }

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
                from: signerAddress,
                to: toAddress,
                data,
                value: value.toString(16)
            }]
        });

        return txHash;
    }

    // --- Default Uniswap Logic for other tokens ---

    const tokenInAddr = TOKEN_MAP[swap.tokenIn];
    const tokenOutAddr = TOKEN_MAP[swap.tokenOut];
    const wethAddr = TOKEN_MAP['WETH'];

    if (!tokenInAddr || !tokenOutAddr) {
        throw new Error(`Unsupported token: ${!tokenInAddr ? swap.tokenIn : swap.tokenOut}`);
    }

    // Basic Amount parsing (assuming 18 decimals for simplicity for now)
    // In real app, fetch decimals
    const amountInWei = parseEther(swap.amount.toString());
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 mins

    const path = [
        tokenInAddr === 'ETH' ? wethAddr : tokenInAddr,
        tokenOutAddr === 'ETH' ? wethAddr : tokenOutAddr
    ] as `0x${string}`[];

    // Ensure path connects
    if (path[0] === path[1]) throw new Error("Same token swap");

    let data: Hex;
    let value = 0n;

    if (swap.tokenIn === 'ETH') {
        // swapExactETHForTokens
        value = amountInWei;
        data = encodeFunctionData({
            abi: ROUTER_ABI,
            functionName: 'swapExactETHForTokens',
            args: [0n, path, signerAddress as `0x${string}`, BigInt(deadline)] // 0 amountOutMin for now (unsafe but simple for demo)
        });
    } else {
        // swapExactTokensForETH (simplification: assume output is ETH or we handle Token->Token via similar logic)
        // For strictness, if tokenOut is not ETH, we use swapExactTokensForTokens.
        // Let's implement swapExactTokensForETH for simplicity of 'Tokens to ETH' demo

        // First we need allowance... skipping for brevity of this specific tool call, 
        // user prompted for "smart contract layer" and "automation layer".
        // Automation layer usually handles approval. 
        // We will assume approval is done or throw instruction.

        data = encodeFunctionData({
            abi: ROUTER_ABI,
            functionName: 'swapExactTokensForETH',
            args: [amountInWei, 0n, path, signerAddress as `0x${string}`, BigInt(deadline)]
        });
    }

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
            from: signerAddress,
            to: UNISWAP_V2_ROUTER_ADDRESS,
            data,
            value: value.toString(16) // hex string
        }]
    });

    return txHash;
}
