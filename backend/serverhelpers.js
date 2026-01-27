export const CHAIN_INFO = {
  "1": { name: "Ethereum", symbol: "ETH" },
  "137": { name: "Polygon", symbol: "MATIC" },
  "42161": { name: "Arbitrum", symbol: "ETH" },
  "10": { name: "Optimism", symbol: "ETH" },
  "8453": { name: "Base", symbol: "ETH" },
  "43114": { name: "Avalanche", symbol: "AVAX" },
  "56": { name: "BSC", symbol: "BNB" },
  "11155111": { name: "Sepolia", symbol: "ETH" },
  "17000": { name: "Holesky", symbol: "ETH" },
  "80002": { name: "Polygon Amoy", symbol: "MATIC" },
  "97": { name: "BSC Testnet", symbol: "BNB" },
  "421614": { name: "Arbitrum Sepolia", symbol: "ETH" },
  "11155420": { name: "Optimism Sepolia", symbol: "ETH" },
  "84532": { name: "Base Sepolia", symbol: "ETH" },
  "43113": { name: "Avalanche Fuji", symbol: "AVAX" }
};

// PRIMARY: Reliable Public RPC URLs (no key needed)
export const PRIMARY_RPC_URLS = {
  "1": "https://ethereum-rpc.publicnode.com",                               // Ethereum
  "137": "https://polygon-rpc.publicnode.com",                              // Polygon
  "42161": "https://arbitrum-rpc.publicnode.com",                           // Arbitrum
  "10": "https://optimism-rpc.publicnode.com",                              // Optimism
  "8453": "https://base-rpc.publicnode.com",                                // Base
  "43114": "https://avalanche-rpc.publicnode.com",                          // Avalanche
  "56": "https://bsc-rpc.publicnode.com",                                   // BSC
  "11155111": "https://rpc.sepolia.org",                                    // Sepolia
  "17000": "https://ethereum-holesky.publicnode.com",                       // Holesky
  "80002": "https://rpc-amoy.polygon.technology",                           // Polygon Amoy
  "97": "https://bsc-testnet.public.blastapi.io",                           // BSC Testnet
  "421614": "https://arbitrum-sepolia-rpc.publicnode.com",                  // Arbitrum Sepolia
  "11155420": "https://optimism-sepolia-rpc.publicnode.com",                // Optimism Sepolia
  "84532": "https://base-sepolia-rpc.publicnode.com",                       // Base Sepolia
  "43113": "https://avalanche-fuji-rpc.publicnode.com"                      // Avalanche Fuji
};

// FALLBACK: Alternative RPC providers
export const FALLBACK_RPC_URLS = {
  "1": "https://eth.api.onfinality.io/public",                              // Ethereum Alt
  "137": "https://polygon.api.onfinality.io/public",                        // Polygon Alt
  "42161": "https://arbitrum.api.onfinality.io/public",                     // Arbitrum Alt
  "10": "https://optimism.api.onfinality.io/public",                        // Optimism Alt
  "8453": "https://base.api.onfinality.io/public",                          // Base Alt
  "43114": "https://avalanche.api.onfinality.io/public",                    // Avalanche Alt
  "56": "https://bsc.api.onfinality.io/public",                             // BSC Alt
  "11155111": "https://rpc2.sepolia.org",                                   // Sepolia Alt
  "17000": "https://ethereum-holesky-rpc.publicnode.com",                   // Holesky Alt
  "80002": "https://polygon-amoy-rpc.publicnode.com",                       // Polygon Amoy Alt
  "97": "https://bsc-testnet-rpc.publicnode.com",                           // BSC Testnet Alt
  "421614": "https://arbitrum-sepolia.publicnode.com",                      // Arbitrum Sepolia Alt
  "11155420": "https://optimism-sepolia.publicnode.com",                    // Optimism Sepolia Alt
  "84532": "https://base-sepolia.publicnode.com",                           // Base Sepolia Alt
  "43113": "https://avalanche-fuji.publicnode.com"                          // Avalanche Fuji Alt
};

export function getRpcUrl(chainIdStr) {
  // Try primary RPC first
  const primaryUrl = PRIMARY_RPC_URLS[chainIdStr];
  if (primaryUrl) return { url: primaryUrl, source: "PublicNode" };
  
  // Fallback to alternative RPC
  const fallbackUrl = FALLBACK_RPC_URLS[chainIdStr];
  if (fallbackUrl) return { url: fallbackUrl, source: "OnFinality" };
  
  return null;
}
