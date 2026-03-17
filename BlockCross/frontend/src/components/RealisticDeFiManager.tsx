import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWallet } from "@/hooks/useWallet";
import { useRealBalances } from "@/hooks/useRealBalances";
import { priceService } from "@/services/priceService";
import { insightsService, PortfolioInsights } from "@/services/insightsService";
import { rebalanceService, RebalancePlan } from "@/services/rebalanceService";
import { executeSwap } from "@/services/swapService";
import { Brain, Wallet, TrendingUp, RefreshCcw, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const RealisticDeFiManager = () => {
  const { isConnected, account, connect } = useWallet();
  const { balances, isLoading: isBalancesLoading, refresh: refreshBalances } = useRealBalances(account);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [insights, setInsights] = useState<PortfolioInsights | null>(null);
  const [rebalancePlan, setRebalancePlan] = useState<RebalancePlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // 1. Fetch Prices & Generate Insights
  useEffect(() => {
    const updateData = async () => {
      if (!account || Object.keys(balances).length === 0) return;
      
      try {
        const currentPrices = await priceService.getPrices();
        setPrices(currentPrices);
        
        const currentInsights = await insightsService.generateInsights(balances, currentPrices);
        setInsights(currentInsights);
        
        // Default target: 50/50 ETH/USDC
        const plan = rebalanceService.calculatePlan(balances, currentPrices, { ETH: 50, USDC: 50 });
        setRebalancePlan(plan);
      } catch (err) {
        console.error("Data update error:", err);
      }
    };
    
    updateData();
  }, [account, balances]);

  const handleExecuteRebalance = async () => {
    if (!rebalancePlan || rebalancePlan.requiredSwaps.length === 0) return;
    
    setIsProcessing(true);
    toast({
        title: "Initiating Rebalance",
        description: "Please confirm transactions in your wallet.",
    });

    try {
      for (const swap of rebalancePlan.requiredSwaps) {
        // Simple mapping for demo purposes
        const action = swap.action === "BUY" ? "buy" : "sell";
        const tokenIn = swap.action === "SELL" ? swap.asset : (swap.asset === "ETH" ? "USDC" : "ETH");
        const tokenOut = swap.asset;
        
        const tx = await executeSwap({
          action: "swap",
          tokenIn,
          tokenOut,
          amountType: "fixed",
          amountValue: swap.amountToken
        });
        
        toast({
          title: "Swap Executed",
          description: `Transaction sent: ${tx.hash.slice(0, 10)}...`,
        });
        
        await tx.wait();
      }
      
      toast({
        title: "Rebalance Complete",
        description: "Your portfolio has been realigned with target allocations.",
      });
      refreshBalances();
    } catch (err: any) {
      toast({
        title: "Rebalance Failed",
        description: err.message || "Transaction was rejected or failed.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10 glass-card">
        <CardContent className="pt-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-2">Connect Your Wallet</CardTitle>
          <CardDescription className="mb-8">
            Connect to see your real blockchain balances and generate AI insights.
          </CardDescription>
          <Button size="lg" onClick={connect} className="px-10">
            Connect MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Balances & Prices */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Wallet Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isBalancesLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(balances).map(([symbol, amount]) => (
                    <div key={symbol} className="flex justify-between items-center p-3 rounded-lg bg-secondary/20">
                      <div>
                        <p className="font-bold">{symbol}</p>
                        <p className="text-xs text-muted-foreground">{amount.toFixed(4)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${((prices[symbol] || 0) * amount).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">@ ${prices[symbol]?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Market Prices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(prices).map(([symbol, price]) => (
                  <div key={symbol} className="flex justify-between text-sm">
                    <span>{symbol}/USD</span>
                    <span className="font-mono">${price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Insights & Rebalance */}
        <div className="w-full md:w-2/3 space-y-6">
          <Card className="glass-card overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    AI Portfolio Advisor
                  </CardTitle>
                  <CardDescription>Real-time data-driven optimization</CardDescription>
                </div>
                {insights && (
                  <Badge variant={insights.riskScore > 70 ? "destructive" : "secondary"} className="h-8">
                    Risk Score: {insights.riskScore}/100
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {insights ? (
                <>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex gap-3">
                      <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm leading-relaxed">{insights.insight}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/10 border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Value</p>
                      <p className="text-2xl font-bold">${insights.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/10 border border-white/5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Allocation</p>
                      <div className="flex items-center gap-2 mt-1">
                        {Object.entries(insights.allocation).map(([sym, pct]) => (
                          <div key={sym} className="text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {sym}: {pct.toFixed(0)}%
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5 text-accent" />
                  Smart Rebalance Plan
                </CardTitle>
                <CardDescription>Target: 50% ETH | 50% USDC</CardDescription>
              </div>
              {rebalancePlan && rebalancePlan.requiredSwaps.length > 0 && (
                 <Button 
                    onClick={handleExecuteRebalance} 
                    disabled={isProcessing}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                 >
                   {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                   Execute Rebalance
                 </Button>
              )}
            </CardHeader>
            <CardContent>
              {rebalancePlan && rebalancePlan.requiredSwaps.length > 0 ? (
                <div className="space-y-3">
                  {rebalancePlan.requiredSwaps.map((swap, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-white/5 rounded-lg bg-black/20">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${swap.action === 'BUY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {swap.action === 'BUY' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{swap.action} {swap.asset}</p>
                          <p className="text-xs text-muted-foreground">{swap.amountToken.toFixed(6)} {swap.asset}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${swap.amountUsd.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : rebalancePlan ? (
                <div className="text-center p-6 bg-secondary/10 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Portfolio is perfectly balanced!</p>
                  <p className="text-xs text-muted-foreground mt-1">No trades required at this time.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
