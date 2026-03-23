import { useState, useEffect } from "react";
import { usePortfolioContext } from "@/contexts/PortfolioContext";
import { rebalanceService, AssetInput, RebalanceResult } from "@/services/rebalanceService";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, 
  TrendingUp, PieChart, Shield, Zap, Info, Loader2, Sparkles, ShieldCheck, ArrowRightLeft, Wallet 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RebalancePage() {
  const { isConnected, data: portfolioData, mode, isLoading } = usePortfolioContext();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (portfolioData) {
      // MASTER PROMPT LOGIC
      const total_value = portfolioData.totalValue;
      const eth_value = portfolioData.eth * portfolioData.ethPrice;
      const target_eth_percentage = 50;
      const current_eth_percentage = total_value > 0 ? (eth_value / total_value) * 100 : 0;
      const drift = current_eth_percentage - target_eth_percentage;
      
      let action = "HOLD";
      if (drift > 10) action = "SELL ETH";
      if (drift < -10) action = "BUY ETH";

      const value_to_adjust = (drift / 100) * total_value;
      const eth_amount = value_to_adjust / portfolioData.ethPrice;
      const health = 100 - Math.abs(drift);

      setMetrics({
        mode,
        current_eth_percentage,
        target_eth_percentage,
        drift,
        health,
        action,
        eth_amount: Math.abs(eth_amount),
        value_to_adjust: Math.abs(value_to_adjust),
        total_value
      });
    }
  }, [portfolioData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center bg-background text-foreground font-bold">
        <p>NO PORTFOLIO DATA FOUND</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 pb-20 px-4 relative pt-16 bg-background text-foreground">
       {/* Mode Indicator */}
       <div className={`absolute top-0 left-0 right-0 py-2 text-center border-b font-bold flex justify-center items-center gap-2 ${mode === 'DEMO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
        {mode === 'DEMO' ? <Info className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        <span className="text-sm uppercase tracking-widest font-bold">{mode === 'DEMO' ? 'Demo Mode — Mock Data Active' : 'Live Mode — Real Data Active'}</span>
      </div>

      <div className="max-w-6xl mx-auto pt-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-4 mb-3">
            <RefreshCw className="w-12 h-12 text-blue-400" />
            Smart Rebalance
          </h1>
          <p className="text-muted-foreground text-lg">Align your portfolio with professional 50/50 Ethereum/USDC strategy.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase">
                  <PieChart className="w-6 h-6 text-blue-400" />
                  Allocation Status
               </h3>
               
               <div className="grid grid-cols-2 gap-8 py-6">
                  <div className="text-center p-6 bg-secondary/50 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1 uppercase">Current ETH</p>
                    <p className="text-4xl font-bold">{metrics.current_eth_percentage.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-6 bg-primary/10 rounded-2xl border border-primary/20">
                    <p className="text-xs font-bold text-primary tracking-widest mb-1 uppercase">Target ETH</p>
                    <p className="text-4xl font-bold">{metrics.target_eth_percentage}%</p>
                  </div>
               </div>

               <div className="mt-6 flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50 text-sm">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Drift detected: <span className="text-foreground font-bold">{metrics.drift.toFixed(2)}%</span></span>
               </div>
            </div>

            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase">
                  <ArrowRightLeft className="w-6 h-6 text-purple-400" />
                  Proposed Action
               </h3>

               <div className="flex items-center justify-between p-8 bg-secondary/20 rounded-2xl border border-border">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1 uppercase">Recommended Move</p>
                    <p className={`text-4xl font-bold ${metrics.action === 'HOLD' ? 'text-blue-400' : 'text-purple-400'}`}>{metrics.action}</p>
                  </div>
                  {metrics.action !== 'HOLD' && (
                    <div className="text-right">
                       <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1 uppercase">Amount to {metrics.action.split(' ')[0]}</p>
                       <p className="text-4xl font-bold">{metrics.eth_amount.toFixed(4)} ETH</p>
                       <p className="text-sm text-muted-foreground font-bold">≈ ${metrics.value_to_adjust.toFixed(2)} USDC</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="glass-card p-8 rounded-3xl relative overflow-hidden group h-full flex flex-col justify-between">
                <div>
                   <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase">
                      <ShieldCheck className="w-6 h-6 text-green-400" />
                      Strategy Health
                   </h3>

                   <div className="flex flex-col items-center justify-center py-10">
                      <div className="text-7xl font-bold">{metrics.health.toFixed(0)}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">HEALTH SCORE / 100</div>
                      
                      <div className="w-full mt-10 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className={`h-full transition-all duration-1000 ${metrics.health > 70 ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-amber-500'}`} 
                          style={{ width: `${metrics.health}%` }} 
                        />
                      </div>
                   </div>
                </div>

                 <Button 
                     variant="hero" 
                     className="w-full py-8 text-xl font-semibold" 
                     disabled={metrics.action === 'HOLD'}
                     onClick={() => toast({ title: "Smart Rebalance", description: "This feature initiates a swap interaction in your wallet." })}
                 >
                   {metrics.action === 'HOLD' ? 'Portfolio Stable' : `Execute ${metrics.action}`}
                 </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
