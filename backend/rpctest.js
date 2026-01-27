import { ethers } from "ethers";

async function getWalletBalance(rpcUrl, walletAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const balanceWei = await provider.getBalance(walletAddress);
    const balanceEth = ethers.formatEther(balanceWei);

    return balanceEth;
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw new Error("Failed to fetch balance");
  }
}

async function main() {
  const SEPOLIA_RPC =
    "https://eth-sepolia.g.alchemy.com/v2/_1DrgpgoYg1fQ2ohpmd8v";

  const walletAddress =
    "0xd70179C5b6Ea2CfFB01561e70B7f196e4d454d92";

  const balance = await getWalletBalance(SEPOLIA_RPC, walletAddress);

  console.log("Testnet Balance:", balance, "ETH");
}

main();
