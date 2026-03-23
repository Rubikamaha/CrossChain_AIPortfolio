import { ethers } from "ethers";

// Uniswap V3 addresses per network
const UNISWAP = {
  1: { // Mainnet
    router:  "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter:  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  },
  11155111: { // Sepolia testnet
    router:  "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48",
    quoter:  "0xEd1f6473345F45b75833fd55D191b246AE8A6Ca",
    factory: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
  },
};

// Common token addresses per network
export const TOKENS: Record<number, Record<string, { address: string; decimals: number; name: string }>> = {
  1: {
    ETH:  { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, name: "Wrapped ETH" }, // WETH
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6,  name: "USD Coin" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6,  name: "Tether" },
    WBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8,  name: "Wrapped BTC" },
    DAI:  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, name: "Dai" },
    UNI:  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, name: "Uniswap" },
    LINK: { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, name: "Chainlink" },
  },
  11155111: { // Sepolia — Uniswap's official testnet token list
    ETH:  { address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", decimals: 18, name: "Wrapped ETH" },
    USDC: { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6,  name: "USD Coin" },
    DAI:  { address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", decimals: 18, name: "Dai" },
    UNI:  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, name: "Uniswap" },
  },
};

const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export interface SwapPreview {
  fromSymbol: string;
  toSymbol: string;
  amountIn: string;
  amountOutMin: string;
  amountOutFormatted: string;
  exchangeRate: string;
  priceImpact: string;
  networkName: string;
  isTestnet: boolean;
}

export interface SwapResult {
  txHash: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export async function getSwapPreview(
  fromSymbol: string,
  toSymbol: string,
  amountIn: string
): Promise<SwapPreview> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  const config = UNISWAP[chainId as keyof typeof UNISWAP];
  if (!config) throw new Error(`Unsupported network (chainId: ${chainId}). Switch to Mainnet or Sepolia.`);

  const tokens = TOKENS[chainId];
  const tokenIn = fromSymbol === "ETH" ? tokens["ETH"] : tokens[fromSymbol];
  const tokenOut = toSymbol === "ETH" ? tokens["ETH"] : tokens[toSymbol];

  if (!tokenIn || !tokenOut) throw new Error(`Token ${fromSymbol} or ${toSymbol} not supported on this network`);

  const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);

  // Get on-chain quote from Uniswap quoter (read-only, no gas)
  const quoter = new ethers.Contract(config.quoter, QUOTER_ABI, provider);
  let amountOut: bigint;
  try {
    amountOut = await quoter.quoteExactInputSingle.staticCall(
      tokenIn.address,
      tokenOut.address,
      3000, // 0.3% fee tier
      amountInWei,
      0
    );
  } catch {
    // Fallback: try 1% fee tier (some pairs only have this)
    amountOut = await quoter.quoteExactInputSingle.staticCall(
      tokenIn.address,
      tokenOut.address,
      10000,
      amountInWei,
      0
    );
  }

  const amountOutFormatted = ethers.formatUnits(amountOut, tokenOut.decimals);
  // 0.5% slippage tolerance
  const amountOutMin = (amountOut * 995n / 1000n).toString();
  const rate = (parseFloat(amountOutFormatted) / parseFloat(amountIn)).toFixed(4);

  return {
    fromSymbol,
    toSymbol,
    amountIn,
    amountOutMin,
    amountOutFormatted: parseFloat(amountOutFormatted).toFixed(6),
    exchangeRate: `1 ${fromSymbol} = ${rate} ${toSymbol}`,
    priceImpact: "< 0.1%",
    networkName: chainId === 1 ? "Ethereum Mainnet" : "Sepolia Testnet",
    isTestnet: chainId !== 1,
  };
}

export async function executeSwap(
  fromSymbol: string,
  toSymbol: string,
  amountIn: string,
  amountOutMin: string
): Promise<SwapResult> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  const config = UNISWAP[chainId as keyof typeof UNISWAP];
  if (!config) throw new Error("Unsupported network");

  const tokens = TOKENS[chainId];
  const tokenIn = tokens[fromSymbol];
  const tokenOut = tokens[toSymbol];
  const isETHIn = fromSymbol === "ETH";
  const address = await signer.getAddress();
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 min

  const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
  const router = new ethers.Contract(config.router, ROUTER_ABI, signer);

  let tx: ethers.TransactionResponse;

  if (isETHIn) {
    // ETH → Token: send ETH as msg.value, tokenIn is WETH
    tx = await router.exactInputSingle(
      {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: 3000,
        recipient: address,
        deadline,
        amountIn: amountInWei,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0,
      },
      { value: amountInWei } // MetaMask will show this ETH amount
    );
  } else {
    // Token → Token or Token → ETH: need ERC20 approval first
    const erc20 = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
    const allowance = await erc20.allowance(address, config.router);

    if (allowance < amountInWei) {
      // MetaMask will pop up for approval transaction
      const approveTx = await erc20.approve(config.router, ethers.MaxUint256);
      await approveTx.wait(); // Wait for approval to confirm
    }

    // MetaMask will pop up for swap transaction
    tx = await router.exactInputSingle({
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      fee: 3000,
      recipient: address,
      deadline,
      amountIn: amountInWei,
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0,
    });
  }

  await tx.wait(); // Wait for confirmation

  const explorerBase = chainId === 1
    ? "https://etherscan.io/tx/"
    : "https://sepolia.etherscan.io/tx/";

  return {
    txHash: tx.hash,
    explorerUrl: explorerBase + tx.hash,
    isTestnet: chainId !== 1,
  };
}
