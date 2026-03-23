import { useState, useEffect } from "react";
import { usePortfolioContext } from "../contexts/PortfolioContext";
import {
  getSwapPreview,
  executeSwap,
  SwapPreview,
  SwapResult,
  TOKENS,
} from "../services/swapService";
import { ethers } from "ethers";

type SwapStep = "input" | "preview" | "executing" | "done" | "error";

export default function AISwapPage() {
  const { isConnected, connect, data, mode } = usePortfolioContext();
  const portfolioTokens = data?.assets || [];
  const [step, setStep] = useState<SwapStep>("input");
  const [fromSymbol, setFromSymbol] = useState("ETH");
  const [toSymbol, setToSymbol] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [aiCommand, setAiCommand] = useState("");
  const [preview, setPreview] = useState<SwapPreview | null>(null);
  const [result, setResult] = useState<SwapResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // AI natural language parser
  const parseAICommand = (cmd: string) => {
    // Matches: "swap 0.1 ETH to USDC" or "exchange 50 USDC for DAI"
    const match = cmd.match(/(?:swap|exchange|convert)\s+([\d.]+)\s+(\w+)\s+(?:to|for|into)\s+(\w+)/i);
    if (match) {
      setAmount(match[1]);
      setFromSymbol(match[2].toUpperCase());
      setToSymbol(match[3].toUpperCase());
      return true;
    }
    return false;
  };

  const handleAICommand = () => {
    if (!parseAICommand(aiCommand)) {
      setError("Could not parse command. Try: 'swap 0.1 ETH to USDC'");
      return;
    }
    setError("");
  };

  const handlePreview = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (fromSymbol === toSymbol) {
      setError("Cannot swap a token to itself");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const p = await getSwapPreview(fromSymbol, toSymbol, amount);
      setPreview(p);
      setStep("preview");
    } catch (e: any) {
      setError(e.message ?? "Failed to get quote");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!preview) return;
    setStep("executing");
    setError("");
    try {
      // This triggers MetaMask popup(s) — user must confirm
      const r = await executeSwap(
        preview.fromSymbol,
        preview.toSymbol,
        preview.amountIn,
        preview.amountOutMin
      );
      setResult(r);
      setStep("done");
    } catch (e: any) {
      // User rejected in MetaMask, or tx failed
      setError(e.message?.includes("user rejected")
        ? "Transaction rejected in MetaMask"
        : (e.message ?? "Transaction failed"));
      setStep("error");
    }
  };

  const reset = () => {
    setStep("input");
    setPreview(null);
    setResult(null);
    setError("");
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <p className="text-gray-500">Connect your wallet to swap tokens</p>
        <button
          onClick={connect}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Available token symbols for the connected network
  const getAvailableTokens = () => {
    // Show tokens the user holds + any additional supported tokens
    const held = portfolioTokens.map((t: any) => t.symbol);
    return [...new Set([...held, "ETH", "USDC", "USDT", "DAI", "UNI", "LINK"])];
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4 pt-24">

      {/* Network badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-foreground">Swap Tokens</h2>
        <NetworkBadge />
      </div>

      {/* AI command input */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-xs text-primary mb-2 font-medium">AI Command (optional)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiCommand}
            onChange={e => setAiCommand(e.target.value)}
            placeholder="swap 0.1 ETH to USDC"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleAICommand}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Parse
          </button>
        </div>
      </div>

      {/* Manual input */}
      {step === "input" && (
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <div className="flex gap-2">
              <select
                value={fromSymbol}
                onChange={e => setFromSymbol(e.target.value)}
                className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm font-medium border-none"
              >
                {getAvailableTokens().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-secondary text-foreground rounded-lg px-3 py-2 text-sm border-none"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => { setFromSymbol(toSymbol); setToSymbol(fromSymbol); }}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-lg border border-border"
            >
              ⇅
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <select
              value={toSymbol}
              onChange={e => setToSymbol(e.target.value)}
              className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm font-medium border-none"
            >
              {getAvailableTokens().filter(s => s !== fromSymbol).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handlePreview}
            disabled={loading || !amount}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 mt-4"
          >
            {loading ? "Getting quote..." : "Get Quote"}
          </button>
        </div>
      )}

      {/* Preview */}
      {step === "preview" && preview && (
        <div className="bg-background border border-border rounded-xl p-4 space-y-3">
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
            preview.isTestnet
              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
              : "bg-green-500/10 text-green-500 border border-green-500/20"
          }`}>
            {preview.networkName}
          </div>

          <div className="space-y-2 text-sm mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">You pay</span>
              <span className="font-medium text-foreground">{preview.amountIn} {preview.fromSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You receive (min)</span>
              <span className="font-medium text-green-500">{preview.amountOutFormatted} {preview.toSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground">{preview.exchangeRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className="text-foreground">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price impact</span>
              <span className="text-foreground">{preview.priceImpact}</span>
            </div>
          </div>

          {preview.isTestnet && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-500 mt-4">
              You are on Sepolia testnet. This uses test ETH — no real funds at risk. MetaMask will still ask for confirmation exactly like mainnet.
            </div>
          )}

          {!preview.isTestnet && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-xs text-orange-500 mt-4">
              You are on Mainnet. This transaction uses real ETH and real gas fees. Confirm carefully in MetaMask.
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex gap-2 mt-4">
            <button onClick={reset} className="flex-1 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary">
              Cancel
            </button>
            <button
              onClick={handleExecute}
              className={`flex-1 py-3 rounded-xl text-white font-medium ${
                preview.isTestnet
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {preview.isTestnet ? "Simulate Swap" : "Confirm Swap"}
            </button>
          </div>
        </div>
      )}

      {/* Executing */}
      {step === "executing" && (
        <div className="bg-background border border-border rounded-xl p-8 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="font-medium text-foreground mt-4">Waiting for MetaMask confirmation...</p>
          <p className="text-sm text-muted-foreground">Check your MetaMask popup. Do not close this window.</p>
        </div>
      )}

      {/* Done */}
      {step === "done" && result && (
        <div className="bg-background border border-green-500/50 rounded-xl p-6 space-y-3">
          <div className="text-center">
            <div className="text-4xl mb-2 text-green-500">✓</div>
            <p className="font-medium text-green-500">Swap Successful!</p>
            <p className="text-xs text-muted-foreground mt-1">
              {result.isTestnet ? "Simulated on Sepolia testnet" : "Executed on Ethereum Mainnet"}
            </p>
          </div>
          <div className="bg-secondary rounded-lg p-3 mt-4">
            <p className="text-xs text-muted-foreground mb-1">Transaction hash</p>
            <p className="font-mono text-xs text-foreground break-all">{result.txHash}</p>
          </div>
          
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-blue-500 hover:underline mt-2"
          >
            View on {result.isTestnet ? "Sepolia Etherscan" : "Etherscan"} →
          </a>
          <button onClick={reset} className="w-full py-3 mt-4 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary">
            New Swap
          </button>
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="bg-background border border-red-500/50 rounded-xl p-6 text-center space-y-3">
          <p className="font-medium text-red-500">Swap Failed</p>
          <p className="text-sm text-red-500/80">{error}</p>
          <button onClick={reset} className="w-full py-3 mt-4 rounded-xl border border-red-500/50 text-red-500 text-sm font-medium hover:bg-red-500/10">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// Small component that shows current network from MetaMask
function NetworkBadge() {
  const [network, setNetwork] = useState<string>("");

  useEffect(() => {
    const getNetwork = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const n = await provider.getNetwork();
      setNetwork(Number(n.chainId) === 1 ? "Mainnet" : `Chain ${n.chainId}`);
    };
    getNetwork();
    
    // Type casting logic for event listeners that might cause ts issues
    const ethereum = window.ethereum as any;
    if (ethereum?.on) ethereum.on("chainChanged", getNetwork);
    return () => {
        if (ethereum?.removeListener) ethereum.removeListener("chainChanged", getNetwork);
    };
  }, []);

  const isMainnet = network === "Mainnet";
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      isMainnet
        ? "bg-green-500/10 text-green-500 border border-green-500/20"
        : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
    }`}>
      {network || "..."}
    </span>
  );
}
