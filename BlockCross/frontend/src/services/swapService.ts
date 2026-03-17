// services/swapService.ts
import { ethers } from "ethers";
import { NETWORKS, NETWORK_MODE } from "../config/networkConfig";
import { ParsedIntent } from "./geminiParser";

// Standard ERC20 ABI for USDC
const erc20ABI = [
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

const routerABI = [
    "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)"
];

/**
 * Executes a token swap based on the passed intent
 * @param intent structured swap intent (must have amountValue)
 * @returns Web3 transaction receipt/hash
 */
export async function executeSwap(intent: ParsedIntent) {
    if (!window.ethereum) throw new Error("Please install MetaMask to execute swaps.");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    const config = NETWORKS[NETWORK_MODE][Number(network.chainId)];
    if (!config) throw new Error(`Unsupported network: Switch to ${NETWORK_MODE} ${Object.values(NETWORKS[NETWORK_MODE]).map((n: any) => n.name).join(' or ')}`);

    const router = new ethers.Contract(config.router, routerABI, signer);
    const userAddress = await signer.getAddress();

    const isEthIn = intent.tokenIn.toUpperCase() === "ETH";
    const isEthOut = intent.tokenOut?.toUpperCase() === "ETH";

    // Build routing path
    const path = [];
    if (isEthIn) {
        path.push(config.weth || config.usdc); // WETH placeholder
        path.push(config.usdc);
    } else if (isEthOut) {
        path.push(config.usdc);
        path.push(config.weth || config.usdc);
    } else {
        throw new Error("Only ETH <-> USDC pairs are supported by this assistant.");
    }

    // Determine Exact Amount In
    let amountInOptions: { value?: bigint, amountIn?: bigint } = {};

    if (isEthIn) {
        const amountInWei = ethers.parseEther(intent.amountValue.toString());
        amountInOptions = { value: amountInWei };
    } else {
        const amountInWei = ethers.parseUnits(intent.amountValue.toString(), 6); // USDC = 6 dec
        amountInOptions = { amountIn: amountInWei };

        // Handle USDC Approval
        const usdcContract = new ethers.Contract(config.usdc, erc20ABI, signer);
        const allowance = await usdcContract.allowance(userAddress, config.router);

        if (BigInt(allowance) < amountInWei) {
            console.log("Approving USDC...");
            const approveTx = await usdcContract.approve(config.router, amountInWei);
            await approveTx.wait(); // Must wait for approval to mine before swap
        }
    }

    // Get Market Quote
    const amountToQuote = isEthIn ? amountInOptions.value : amountInOptions.amountIn;
    let amountsOut;
    try {
        amountsOut = await router.getAmountsOut(amountToQuote, path);
    } catch (err) {
        throw new Error("Unable to fetch market quote. Ensure there is enough liquidity.");
    }

    // 1% Slippage Guard
    const slippageMultiplier = 99n;
    const amountOutMin = (amountsOut[1] * slippageMultiplier) / 100n;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 Min

    // Execute Tx & Gas Estimates
    let tx;
    if (isEthIn) {
        // ETH -> Tokens
        const gasEstimate = await router.swapExactETHForTokens.estimateGas(
            amountOutMin,
            path,
            userAddress,
            deadline,
            { value: amountInOptions.value }
        );

        // Execute Adding 20% to the exact gas estimate for safety margin
        tx = await router.swapExactETHForTokens(
            amountOutMin,
            path,
            userAddress,
            deadline,
            { value: amountInOptions.value, gasLimit: (gasEstimate * 120n) / 100n }
        );
    } else {
        // Tokens -> ETH
        const gasEstimate = await router.swapExactTokensForETH.estimateGas(
            amountInOptions.amountIn,
            amountOutMin,
            path,
            userAddress,
            deadline
        );

        // Execute Adding 20% to the exact gas estimate for safety margin
        tx = await router.swapExactTokensForETH(
            amountInOptions.amountIn,
            amountOutMin,
            path,
            userAddress,
            deadline,
            { gasLimit: (gasEstimate * 120n) / 100n }
        );
    }

    return tx;
}
