import { useState, useEffect } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { aiService, AIAnalysis } from '@/lib/aiService';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useProfile } from '@/contexts/ProfileContext';
import { Brain, Sparkles, AlertTriangle, Loader2, PieChart, Globe as GlobeIconLucide } from 'lucide-react';
import { type PortfolioData } from '@/lib/walletService';

export default function InsightsPage() {
    const { isConnected } = useWallet();
    const { data: portfolioData, mode, isLoading: isPortfolioLoading } = usePortfolioData();

    const activeData = portfolioData;
    const hasBalances = activeData && activeData.totalValue > 0;

    const {
        riskPersonality,
        learningMode,
        notifications,
        updateAIInsightTime,
        updateHealthScore,
        updateSyncTime
    } = useProfile();

    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insightMode, setInsightMode] = useState<'Market Mode' | 'Wallet Mode' | 'Risk Mode'>('Market Mode');

    useEffect(() => {
        if (activeData) {
            updateHealthScore(50, ""); // simplified for now
            if (isConnected) updateSyncTime();
        }
    }, [activeData, updateHealthScore, updateSyncTime, riskPersonality, isConnected]);

    const handleGenerateAnalysis = async () => {
        if (!activeData) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await aiService.generatePortfolioAnalysis(activeData as PortfolioData, {
                riskPersonality,
                learningMode,
                notifications,
                healthScore: 50,
                insightMode
            });

            setAnalysis(result);
            if (isConnected) updateAIInsightTime();
        } catch (err) {
            const error = err as any;
            setError(error.message || 'Failed to generate analysis');
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (analysis && !isGenerating) {
            handleGenerateAnalysis();
        }
    }, [insightMode]);

    const getRiskColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'low': return 'text-success bg-success/10 border-success/20';
            case 'medium': return 'text-warning bg-warning/10 border-warning/20';
            case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
            default: return 'text-muted-foreground';
        }
    };

    if (isPortfolioLoading) {
        return (
            <div className="min-h-screen py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 pb-20 relative">
            {/* Mode Banner */}
            <div className={`absolute top-0 left-0 right-0 py-2 text-center border-b mb-4 z-10 font-bold flex justify-center items-center gap-2 ${
                mode === 'DEMO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
            }`}>
                {mode === 'DEMO' ? (
                    <>
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">Demo Mode Active – Connect your wallet to see live blockchain data.</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">Live Mode Active – Real-time blockchain data loaded.</span>
                    </>
                )}
            </div>

            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${mode !== 'LIVE' ? 'pt-10' : ''}`}>
                <div className="mb-8 pl-1">
                    <h1 className="font-heading text-3xl font-bold flex items-center gap-3 mb-2">
                        <Brain className="w-8 h-8 text-accent" />
                        AI Portfolio Advisor
                    </h1>
                    <p className="text-muted-foreground">
                        Get personalized, data-driven insights for your cross-chain portfolio.
                    </p>
                </div>

                {!hasBalances ? (
                    <div className="glass-card p-12 text-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Brain className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            To generate AI insights, please connect a wallet with balances.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(!analysis || !analysis.analytics) ? (
                            <div className="glass-card p-12 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-accent/5 to-transparent blur-3xl" />
                                <div className="relative z-10">
                                    <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
                                    <h2 className="text-2xl font-bold mb-3">Ready to Analyze Your Portfolio</h2>
                                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                                        Our AI will analyze your assets across multiple chains to provide optimization strategies, risk assessment, and detailed recommendations.
                                    </p>

                                    <div className="flex justify-center gap-4 mb-8">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">Select Insight Mode</span>
                                            <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg">
                                                {(['Market Mode', 'Wallet Mode', 'Risk Mode'] as const).map((m) => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setInsightMode(m)}
                                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${insightMode === m
                                                            ? 'bg-accent text-accent-foreground shadow-sm'
                                                            : 'hover:bg-secondary/50 text-muted-foreground'
                                                            }`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

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
                                                Generate AI analysis
                                            </>
                                        )}
                                    </Button>

                                    {error && (
                                        <div className="glass-card mt-8 p-4 border border-destructive/30 bg-destructive/5 text-destructive font-medium flex items-center justify-center gap-2 mx-auto max-w-md">
                                            <AlertTriangle className="w-5 h-5" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Mode Selector */}
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-secondary/20 p-4 rounded-xl border border-white/5 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-accent" />
                                        <span className="font-semibold text-lg">Insight Mode:</span>
                                    </div>
                                    <div className="flex gap-2 bg-background/50 p-1 rounded-lg overflow-x-auto max-w-full">
                                        {(['Market Mode', 'Wallet Mode', 'Risk Mode'] as const).map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setInsightMode(m)}
                                                disabled={isGenerating}
                                                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${insightMode === m
                                                    ? 'bg-accent text-accent-foreground shadow-md'
                                                    : 'hover:bg-secondary/50 text-muted-foreground'
                                                    }`}
                                            >
                                                {isGenerating && insightMode === m ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Analytics Overview Top Row */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="glass-card p-6 flex flex-col justify-center text-center">
                                        <span className="text-muted-foreground text-sm font-medium">Total Value (USD)</span>
                                        <span className="text-3xl font-bold mt-2">${analysis.analytics.total_value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="glass-card p-6 flex flex-col items-center justify-center">
                                        <span className="text-muted-foreground text-sm font-medium">Risk Score</span>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-4 py-1.5 rounded-full text-lg font-bold border ${analysis.analytics.risk_score > 60 ? 'text-destructive border-destructive/30 bg-destructive/10' : analysis.analytics.risk_score > 30 ? 'text-warning border-warning/30 bg-warning/10' : 'text-success border-success/30 bg-success/10'}`}>
                                                {analysis.analytics.risk_score} / 100
                                            </span>
                                        </div>
                                    </div>

                                    <div className="glass-card p-6 flex flex-col justify-center text-center">
                                        <span className="text-muted-foreground text-sm font-medium">Volatility Exposure</span>
                                        <span className={`text-2xl font-bold mt-2 ${getRiskColor(analysis.analytics.volatility_exposure_level).split(' ')[0]}`}>
                                            {analysis.analytics.volatility_exposure_level}
                                        </span>
                                    </div>

                                    <div className="glass-card p-6 flex flex-col justify-center text-center">
                                        <span className="text-muted-foreground text-sm font-medium">Active Chains</span>
                                        <span className="text-3xl font-bold mt-2 text-primary">{analysis.analytics.active_chains}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6">
                                        <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                            <GlobeIconLucide className="w-5 h-5 text-accent" />
                                            Chain Distribution
                                        </h3>
                                        <div className="space-y-4 mt-4">
                                            {Object.entries(analysis.analytics.chain_distribution).map(([chain, pct]) => (
                                                <div key={chain}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>{chain}</span>
                                                        <span className="font-medium text-accent">{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary/30 h-2.5 rounded-full overflow-hidden">
                                                        <div className="bg-gradient-to-r from-accent to-accent/80 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="glass-card p-6">
                                        <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                                            <PieChart className="w-5 h-5 text-primary" />
                                            Asset Allocation
                                        </h3>
                                        <div className="space-y-4 mt-4">
                                            {Object.entries(analysis.analytics.asset_distribution).map(([asset, pct]) => (
                                                <div key={asset}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="font-bold">{asset}</span>
                                                        <span className="font-medium text-primary">{pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary/30 h-2.5 rounded-full overflow-hidden">
                                                        <div className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
