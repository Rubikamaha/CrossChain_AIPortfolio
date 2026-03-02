import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  ShieldCheck,
  Search,
  TrendingUp,
  AlertTriangle,
  Zap,
  Lock,
  Info,
  ChevronRight,
  Loader2,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Target
} from 'lucide-react';
import type { PortfolioData } from '@/lib/walletService';
import { aiService, type AIAnalysis } from '@/lib/aiService';
import { Link } from 'react-router-dom';

interface AIInsightsProps {
  portfolioData?: PortfolioData;
  isConnected: boolean;
  analysis: AIAnalysis | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export function AIInsights({ portfolioData, isConnected, analysis, isAnalyzing, onAnalyze }: AIInsightsProps) {

  // If not connected, show default teaser
  if (!isConnected || !portfolioData) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-12 text-center bg-gradient-to-b from-secondary/10 to-transparent">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Connect Wallet to Enable AI Insights</h3>
            <p className="text-muted-foreground">Get intelligent analysis of your cross-chain portfolio.</p>
          </div>
        </div>
      </section>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };



  // Safely check how many chains have assets
  const balances = portfolioData?.balances || [];
  const activeChains = balances.reduce((acc, curr) => {
    if (!acc.includes(curr.chainName)) acc.push(curr.chainName);
    return acc;
  }, [] as string[]);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            AI Insights
          </h2>
          <Link to="/insights">
            <Button variant="ghost" size="sm" className="text-primary">
              View Full Analysis
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis Card */}
          <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-accent/10 to-transparent opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-secondary/30 rounded-full">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Portfolio Intelligence</h3>
                  <p className="text-sm text-muted-foreground">
                    Scanning <span className="text-white font-medium">{activeChains.length} Chains</span>
                    {' • '}
                    Analyzing <span className="text-white font-medium">{portfolioData.balances.length} Assets</span>
                  </p>
                </div>
              </div>

              {!analysis ? (
                <div className="py-8">
                  <p className="text-lg text-muted-foreground mb-6 max-w-lg">
                    We can calculate a real-time health score and provide instant recommendations for your current portfolio.
                  </p>
                  <Button onClick={onAnalyze} disabled={isAnalyzing} size="lg" className="w-full sm:w-auto">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculating Score...
                      </>
                    ) : (
                      "Calculate Health Score"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-8 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Health Score</p>
                      <span className={`text - 5xl font - bold ${getHealthColor(analysis.healthScore)} `}>
                        {analysis.healthScore}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                      <span className="text-2xl font-semibold text-white">{analysis.riskLevel}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">{analysis.summary}</p>
                </div>
              )}
            </div>

            {analysis && (
              <div className="relative z-10 pt-4 border-t border-border/30">
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {activeChains.join(", ")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Top Pick / Teaser Card */}
          <div className="glass-card p-6 flex flex-col justify-center items-center text-center">
            {!analysis ? (
              <>
                <Target className="w-12 h-12 text-secondary mb-4" />
                <h4 className="text-lg font-semibold mb-2">Hidden Opportunities</h4>
                <p className="text-muted-foreground text-sm mb-6">Run the analysis to reveal our top AI-selected pick for your portfolio.</p>
                <Button variant="outline" onClick={onAnalyze} disabled={isAnalyzing}>
                  Reveal Top Pick
                </Button>
              </>
            ) : (
              <div className="w-full text-left animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  <p className="text-sm font-medium text-muted-foreground">AI Top Pick</p>
                </div>
                <h3 className="text-2xl font-bold mb-1">{analysis.topPick.asset}</h3>
                <p className="text-sm text-success font-medium mb-4">Strong Buy Signal</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.topPick.reason}
                </p>
                <Link to="/insights">
                  <Button variant="outline" size="sm" className="mt-6 w-full">
                    View Full Report
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
