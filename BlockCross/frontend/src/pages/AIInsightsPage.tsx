import { useState, useEffect } from 'react';
import { usePortfolioContext } from '@/contexts/PortfolioContext';
import { Brain, Sparkles, Loader2, PieChart, ShieldAlert, TrendingUp, Wallet, Info } from 'lucide-react';
import { PortfolioMetrics } from '@/services/insightsService';
import { geminiInsightsService, AIInsightResponse } from '@/services/geminiInsightsService';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';

export default function InsightsPage() {
  const { data: activeData, mode, isLoading: isPortfolioLoading } = usePortfolioContext();
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [analysis, setAnalysis] = useState<AIInsightResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeData) {
      const eth = activeData.eth ?? 0;
      const ethPrice = activeData.ethPrice ?? 0;
      const totalValue = activeData.totalValue ?? 0;

      const ethValueUsd = eth * ethPrice;
      const usdcValueUsd = Math.max(0, totalValue - ethValueUsd);
      const ethPercentage = totalValue > 0 ? (ethValueUsd / totalValue) * 100 : 0;
      const usdcPercentage = totalValue > 0 ? (usdcValueUsd / totalValue) * 100 : 0;
      const concentrationRisk = Math.max(ethPercentage, usdcPercentage);
      const healthScore = totalValue > 0 ? Math.max(0, Math.round(100 - Math.abs(50 - ethPercentage) * 2)) : 0;
      const volatility: 'low' | 'medium' | 'high' = ethPercentage > 70 ? 'high' : ethPercentage > 30 ? 'medium' : 'low';
      const marketTrend: 'bullish' | 'bearish' | 'neutral' = ethPrice > 2000 ? 'bullish' : 'neutral';

      setMetrics({
        total_value_usd: totalValue,
        eth_value_usd: ethValueUsd,
        usdc_value_usd: usdcValueUsd,
        asset_distribution: {
          eth_percentage: Number(ethPercentage.toFixed(2)),
          usdc_percentage: Number(usdcPercentage.toFixed(2)),
        },
        concentration_risk_score: Number(concentrationRisk.toFixed(2)),
        volatility_exposure_level: volatility,
        portfolio_health_score: healthScore,
        market_trend: marketTrend,
      });
    }
  }, [activeData]);

  const handleGenerateAnalysis = async () => {
    if (!metrics) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await geminiInsightsService.generateInsights(metrics, settings.riskProfile);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI analysis.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isPortfolioLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>No assets detected. Please connect your wallet.</p>
      </div>
    );
  }

  const riskScore = metrics.concentration_risk_score;
  const healthScore = metrics.portfolio_health_score;
  const ethPct = metrics.asset_distribution.eth_percentage;

  return (
    <div className="min-h-screen py-10 pb-20 relative bg-background text-foreground">
      {/* Mode Indicator */}
      <div className={`absolute top-0 left-0 right-0 py-2 text-center border-b font-bold flex justify-center items-center gap-2 ${mode === 'DEMO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
        {mode === 'DEMO' ? <Info className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        <span className="text-sm uppercase tracking-widest font-black">{mode === 'DEMO' ? 'Demo Mode — Mock Data Active' : 'Live Mode — Real Data Active'}</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-4 mb-3">
            <Brain className="w-12 h-12 text-blue-400" />
            AI Insights
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered portfolio analysis using real-time blockchain data.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <InsightCard title="ETH Value" value={`$${metrics.eth_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={<Wallet className="text-blue-400" />} />
          <InsightCard title="Total Value" value={`$${metrics.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={<PieChart className="text-purple-400" />} />
          <InsightCard title="ETH Allocation" value={`${ethPct.toFixed(1)}%`} icon={<TrendingUp className="text-green-400" />} />
          <InsightCard title="Risk Score" value={riskScore.toFixed(0)} icon={<ShieldAlert className="text-red-400" />} color={riskScore > 70 ? 'text-red-400' : 'text-green-400'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 blur-3xl -z-10 group-hover:bg-blue-400/10 transition-all" />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase">
                <ShieldAlert className="w-6 h-6 text-blue-400" />
                Portfolio Health
              </h3>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-800 stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                    <circle
                      className={`${healthScore > 70 ? 'text-green-500' : 'text-amber-500'} stroke-current transition-all duration-1000`}
                      strokeWidth="10"
                      strokeDasharray={`${healthScore * 2.51} 251.2`}
                      strokeLinecap="round"
                      fill="transparent"
                      r="40" cx="50" cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{healthScore}</span>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">SCORE</span>
                  </div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground font-medium text-center">
                  Based on your current {ethPct.toFixed(1)}% ETH concentration.
                </p>
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full py-8 text-xl font-semibold"
              disabled={isGenerating}
              onClick={handleGenerateAnalysis}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate AI Insights
                </>
              )}
            </Button>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl -z-10 group-hover:bg-purple-500/10 transition-all" />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase">
                <Sparkles className="w-6 h-6 text-purple-400" />
                AI Recommendation
              </h3>

              {analysis ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${
                      analysis.recommendation === 'BUY' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      analysis.recommendation === 'SELL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {analysis.recommendation}
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Confidence: {analysis.confidence_score}</div>
                  </div>

                  <p className="text-2xl font-bold leading-tight text-foreground">
                    "{analysis.summary}"
                  </p>

                  <div className="bg-secondary/30 p-6 rounded-2xl border border-border/50">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-widest">Reasoning</h4>
                    <p className="text-foreground leading-relaxed font-medium">
                      {analysis.reason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
                  <Info className="w-12 h-12 opacity-20" />
                  <p className="font-bold uppercase tracking-widest">Ready for analysis</p>
                  <p className="text-sm">Click the button to run the AI engine.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, icon, color = 'text-foreground' }: { title: string; value: string | number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="glass-card p-6 rounded-3xl transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-secondary">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
