import { useState, useEffect } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useWallet } from '@/hooks/useWallet';
import { AlertTriangle, Sparkles, Brain, Loader2, ArrowRightLeft, ArrowDown, Wallet, Info } from 'lucide-react';
import SwapAssistant from '@/components/SwapAssistant';
import { swapETHToUSDC } from '@/services/swapService';
import { Button } from '@/components/ui/button';
import { ethers } from "ethers";

export default function AISwapPage() {
  const { mode, data, isLoading, isConnected } = usePortfolioData();
  const [isTestnet, setIsTestnet] = useState(false);

  // Direct Swap State
  const [inputVal, setInputVal] = useState<string>("0.5");
  const [status, setStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum && isConnected) {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const network = await provider.getNetwork();
        setIsTestnet(network.chainId !== 1n);
      }
    };
    checkNetwork();
  }, [isConnected]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const ethPrice = data?.ethPrice || 2000;
  const estimatedOutput = (parseFloat(inputVal) || 0) * ethPrice;

  const handleDirectSwap = async () => {
    // SECURITY: Always ask MetaMask confirmation
    const confirmed = window.confirm(`Confirm swap of ${inputVal} ETH to USDC?`);
    if (!confirmed) return;

    setIsSwapping(true);
    setStatus("Initiating transaction...");
    setTxHash("");

    try {
      // MASTER PROMPT: Simulation logic
      if (!isConnected || isTestnet) {
        const fakeHash = "0xTEST123";
        await new Promise(r => setTimeout(r, 2000));
        setTxHash(fakeHash);
        setStatus("Swap Successful (Simulation)");
        return;
      }

      // Real Swap (Mainnet)
      const result = await swapETHToUSDC(parseFloat(inputVal));
      setTxHash(result);
      setStatus("Transaction confirmed on Mainnet!");
    } catch (err: any) {
      setStatus(err.message || "Transaction failed.");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen py-10 pb-20 px-4 relative pt-16 bg-background text-foreground">
      {/* Mode Indicator */}
      <div className={`absolute top-0 left-0 right-0 py-2 text-center border-b font-bold flex justify-center items-center gap-2 ${mode === 'DEMO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
        {mode === 'DEMO' ? <Info className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        <span className="text-sm uppercase tracking-widest font-bold">{mode === 'DEMO' ? 'Demo Mode — Mock Data Active' : 'Live Mode — Real Data Active'}</span>
      </div>

      <div className="max-w-4xl mx-auto pt-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 mb-6">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3 uppercase tracking-tight">AI Swap</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
            Natural language trading powered by advanced intent parsing.
            Executes on Uniswap Router 0x7a2...88d.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulation logic: SwapAssistant works in Demo Mode too */}
          <div className="glass-card p-2 md:p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-all" />
            <SwapAssistant />
          </div>

          <div className="glass-card p-8 rounded-3xl flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-widest">
              <ArrowRightLeft className="w-6 h-6 text-primary" />
              Quick Swap
            </h2>

            <div className="space-y-6 flex-1">
              <div className="bg-secondary/30 p-6 rounded-2xl border border-border hover:border-primary/50 transition-all">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest block mb-2">Selling ETH</label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="bg-transparent text-3xl font-bold outline-none w-full"
                    placeholder="0.0"
                  />
                  <span className="font-bold text-foreground/80 ml-4">ETH</span>
                </div>
              </div>

              <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-slate-700 p-3 rounded-full border border-slate-600 shadow-xl">
                  <ArrowDown className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              <div className="bg-secondary/30 p-6 rounded-2xl border border-border hover:border-primary/50 transition-all">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest block mb-2">Buying USDC</label>
                <div className="flex items-center justify-between">
                   <div className="text-3xl font-bold text-foreground/60">
                    {estimatedOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="font-bold text-foreground/80 ml-4">USDC</span>
                </div>
              </div>

              <div className="pt-4 space-y-2 border-t border-border">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Exchange Rate</span>
                  <span className="text-foreground/80 italic">1 ETH = ${ethPrice.toLocaleString()} USDC</span>
                </div>
              </div>
            </div>

            {status && (
              <div className={`mt-6 p-4 rounded-2xl text-sm border-2 animate-in fade-in zoom-in duration-300 ${status.includes("Error") || status.includes("failed")
                  ? "bg-red-900/10 border-red-500/30 text-red-500"
                  : "bg-blue-900/10 border-blue-500/30 text-blue-400"
                }`}>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold uppercase tracking-wider">{status}</p>
                    {txHash && (
                      <div className="mt-2 text-xs font-mono bg-black/30 p-2 rounded-lg flex items-center justify-between">
                        <span className="truncate mr-4">{txHash}</span>
                        <a href={isConnected && !isTestnet ? `https://etherscan.io/tx/${txHash}` : "#"} target={isConnected && !isTestnet ? "_blank" : "_self"} rel="noreferrer" className="text-blue-500 hover:underline">VIEW</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="hero"
              onClick={handleDirectSwap}
              disabled={isSwapping || !inputVal || parseFloat(inputVal) <= 0}
              className="w-full mt-8 py-8 text-xl font-semibold"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-6 h-6" />
                  {isConnected && !isTestnet ? "Execute Real Swap" : "Confirm Swap (Sim)"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
