import { useState, useEffect } from 'react';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { aiService, AIAnalysis } from '@/lib/aiService';
import { Button } from '@/components/ui/button';
import { useNetworkMode } from '@/contexts/NetworkModeContext';
import { Brain, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { ChainBadge } from '@/components/ChainBadge';
import { useWallet } from '@/hooks/useWallet';
import { useProfile } from '@/contexts/ProfileContext';

export default function AIInsightsPage() {
    const { account, isConnected } = useWallet();
    const { networkMode } = useNetworkMode();
    const { data: portfolioData, isLoading: isWalletLoading } = useWalletBalances({
        address: account,
        networkMode
    });
    const {
        riskPersonality,
        learningMode,
        notifications,
        activity,
        updateAIInsightTime,
        updateHealthScore,
        updateSyncTime
    } = useProfile();
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate and update health score when portfolio data is available
    useEffect(() => {
        if (portfolioData) {
            const updateScoreAndSync = async () => {
                const { calculateHealthScore } = await import('@/lib/walletService');
                const health = calculateHealthScore(portfolioData, riskPersonality);
                updateHealthScore(health.score, health.explanation);
                updateSyncTime();
            };
            updateScoreAndSync();
        }
    }, [portfolioData, updateHealthScore, updateSyncTime, riskPersonality]);

    const handleGenerateAnalysis = async () => {
        if (!portfolioData) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await aiService.generatePortfolioAnalysis(portfolioData, {
                riskPersonality,
                learningMode,
                notifications,
                healthScore: activity.healthScore
            });
            setAnalysis(result);
            updateAIInsightTime();
        } catch (err: any) {
            setError(err.message || 'Failed to generate analysis');
        } finally {
            setIsGenerating(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'low': return 'text-success bg-success/10 border-success/20';
            case 'medium': return 'text-warning bg-warning/10 border-warning/20';
            case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
            default: return 'text-muted-foreground';
        }
    };

    if (isWalletLoading) {
        return (
            <div className="min-h-screen py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Check if wallet is connected and has balances
    const hasBalances = portfolioData && portfolioData.balances.length > 0;

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-heading text-3xl font-bold flex items-center gap-3 mb-2">
                        <Brain className="w-8 h-8 text-accent" />
                        AI Portfolio Advisor
                    </h1>
                    <p className="text-muted-foreground">
                        Get personalized, data-driven insights for your cross-chain portfolio
                    </p>
                </div>

                {!hasBalances ? (
                    <div className="glass-card p-12 text-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Brain className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            To generate AI insights, please connect a wallet with balances on {networkMode === 'all' ? 'any supported chain' : `supported ${networkMode} chains`}.
                        </p>
                    </div>
                ) : !analysis ? (
                    <div className="glass-card p-12 text-center relative overflow-hidden">
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-accent/5 to-transparent blur-3xl" />

                        <div className="relative z-10">
                            <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h2 className="text-2xl font-bold mb-3">Ready to Analyze Your Portfolio</h2>
                            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                                Our AI will analyze your {portfolioData.balances.length} assets across {portfolioData.connectedChains} chains to provide optimization strategies, risk assessment, and detailed recommendations.
                            </p>

                            <Button
                                size="lg"
                                onClick={handleGenerateAnalysis}
                                disabled={isGenerating}
                                className="min-w-[200px]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing Portfolio...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-4 h-4 mr-2" />
                                        Generate AI Analysis
                                    </>
                                )}
                            </Button>

                            {error && (
                                <p className="mt-4 text-destructive flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Features preview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
                            {[
                                { title: "Risk Assessment", icon: <ShieldCheck className="w-5 h-5 text-success" />, desc: "Detailed breakdown of safe vs risky assets" },
                                { title: "Smart Diversification", icon: <TrendingUp className="w-5 h-5 text-accent" />, desc: "Suggestions to balance your portfolio exposure" },
                                { title: "Actionable Insights", icon: <Brain className="w-5 h-5 text-primary" />, desc: "Simple Buy/Sell/Hold recommendations" }
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                                    <div className="flex items-center gap-2 mb-2 font-semibold">
                                        {item.icon}
                                        {item.title}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 flex flex-col items-center text-center">
                                <span className="text-muted-foreground mb-2">Portfolio Health</span>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" className="stroke-secondary" strokeWidth="8" fill="none" />
                                        <circle
                                            cx="48" cy="48" r="40"
                                            className="stroke-success transition-all duration-1000 ease-out"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * analysis.healthScore) / 100}
                                        />
                                    </svg>
                                    <span className="absolute text-2xl font-bold">{analysis.healthScore}</span>
                                </div>
                            </div>

                            <div className="glass-card p-6 flex flex-col justify-center">
                                <span className="text-muted-foreground mb-3">Risk Level</span>
                                <span className={`px-4 py-2 rounded-lg border text-center text-lg font-bold ${getRiskColor(analysis.riskLevel)}`}>
                                    {analysis.riskLevel}
                                </span>
                                <p className="mt-3 text-sm text-muted-foreground text-center">
                                    {analysis.analysis.volatility}
                                </p>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <StarIcon className="w-5 h-5 text-accent" />
                                    <span className="font-semibold">Top Pick</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{analysis.topPick.asset}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {analysis.topPick.reason}
                                </p>
                            </div>
                        </div>

                        {/* Analysis & Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 glass-card p-8">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-primary" />
                                    Advisor Summary
                                </h3>
                                <p className="text-lg leading-relaxed mb-6">
                                    {analysis.summary}
                                </p>

                                <h4 className="font-semibold mb-3 text-muted-foreground">Detailed Analysis</h4>
                                <div className="grid gap-4">
                                    <div className="p-4 bg-secondary/20 rounded-lg">
                                        <span className="block text-sm font-medium text-accent mb-1">Diversification</span>
                                        <p className="text-muted-foreground">{analysis.analysis.diversification}</p>
                                    </div>
                                    <div className="p-4 bg-secondary/20 rounded-lg">
                                        <span className="block text-sm font-medium text-success mb-1">Performance</span>
                                        <p className="text-muted-foreground">{analysis.analysis.performance}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold mb-4">Recommendations</h3>
                                <div className="space-y-4">
                                    {analysis.recommendations.map((rec, i) => (
                                        <div key={i} className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold">{rec.asset}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${rec.type === 'Buy' ? 'bg-success/20 text-success' :
                                                    rec.type === 'Sell' ? 'bg-destructive/20 text-destructive' :
                                                        'bg-warning/20 text-warning'
                                                    }`}>
                                                    {rec.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full mt-6"
                                    onClick={() => setIsGenerating(false)} // Reset to regenerate
                                >
                                    Regenerate Analysis
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}
