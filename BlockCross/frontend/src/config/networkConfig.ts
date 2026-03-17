// config/networkConfig.ts

export const NETWORK_MODE = import.meta.env.VITE_NETWORK_MODE || "testnet"; // "mainnet" or "testnet"

export const NETWORKS: Record<string, Record<number, { name: string; router: string; usdc: string; weth?: string }>> = {
    mainnet: {
        1: {
            name: "Ethereum",
            router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        },
        56: {
            name: "BSC",
            router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
            usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
            weth: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // WBNB
        }
    },
    testnet: {
        11155111: {
            name: "Sepolia",
            router: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Uniswap V2 Router on Sepolia
            usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Mock USDC
            weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" // WETH
        },
        97: {
            name: "BSC Testnet",
            router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
            usdc: "0x64544969ed7EBf5f083679233325356EBe738930",
            weth: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" // WBNB
        }
    }
};
