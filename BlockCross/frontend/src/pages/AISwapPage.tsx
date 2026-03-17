import { useState } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useWallet } from '@/hooks/useWallet';
import { AlertTriangle, Sparkles, Brain, Loader2, ArrowRightLeft } from 'lucide-react';
import SwapAssistant from '@/components/SwapAssistant';

export default function AISwapPage() {
  const { mode } = usePortfolioData();
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen py-10 pb-20 px-4 relative pt-16">
      {/* Mode Banner */}
      <div className={`absolute top-0 left-0 right-0 py-2 text-center border-b mb-4 z-10 font-bold flex justify-center items-center gap-2 ${
        mode === 'DEMO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
      }`}>
        {mode === 'DEMO' ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Demo Mode Active – Connect your wallet to execute live swaps.</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Live Mode Active – Real transactions enabled.</span>
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-accent/10 mb-4">
            <Brain className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-3">AI Swap Assistant</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trade more efficiently across chains using natural language. 
            Powered by advanced intent parsing and DEX routers.
          </p>
        </div>

        <div className="glass-card p-2 md:p-8 bg-gradient-to-br from-card/50 to-background/50 border-white/5 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-3xl -z-10" />
          
          <SwapAssistant />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-bold flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-5 h-5 text-accent" />
              Supported Networks
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-white/5">Ethereum</span>
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-white/5">BSC</span>
              <span className="px-3 py-1 rounded-full bg-secondary/30 border border-white/5">Polygon (Soon)</span>
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-bold flex items-center gap-2 mb-3 font-heading">
              <Sparkles className="w-5 h-5 text-primary" />
              Slippage Protection
            </h3>
            <p className="text-sm text-muted-foreground">
              Direct interaction with Uniswap V2 and PancakeSwap V2 routers with automatic 1.0% max slippage guard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
