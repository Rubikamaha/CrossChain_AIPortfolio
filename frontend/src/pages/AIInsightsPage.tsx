import { useState, useEffect } from 'react';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { aiService, AIAnalysis } from '@/lib/aiService';
import { insightHistoryService, TrendData } from '@/lib/insightHistoryService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNetworkMode } from '@/contexts/NetworkModeContext';
import { Brain, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, ArrowRight, Loader2, History, BarChart3 } from 'lucide-react';
import { ChainBadge } from '@/components/ChainBadge';
import { useWallet } from '@/hooks/useWallet';
import { useProfile } from '@/contexts/ProfileContext';
import { TrendCharts } from '@/components/TrendCharts';

import { mockPortfolioData } from '@/data/mockData';

export default function AIInsightsPage() {
    const { account, isConnected } = useWallet();
    const { networkMode } = useNetworkMode();
    const { data: portfolioData, isLoading: isWalletLoading } = useWalletBalances({
        address: account,
        networkMode
    });

    // DEMO DOE LOGIC
    const activeData = isConnected ? portfolioData : (mockPortfolioData as unknown as import('@/lib/walletService').PortfolioData);
    const hasBalances = activeData && activeData.balances.length > 0;

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
    const [trendData, setTrendData] = useState<TrendData | null>(null);
    const [isLoadingTrends, setIsLoadingTrends] = useState(false);
    const [activeTab, setActiveTab] = useState<'current' | 'trends'>('current');
    const [insightMode, setInsightMode] = useState<'Market-Based' | 'Wallet-Based' | 'Risk-Focused'>('Market-Based');

    // Calculate and update health score when portfolio data is available
    useEffect(() => {
        if (activeData) {
            const updateScoreAndSync = async () => {
                const { calculateHealthScore } = await import('@/lib/walletService');
                const health = calculateHealthScore(activeData, riskPersonality);
                updateHealthScore(health.score, health.explanation);
                if (isConnected) updateSyncTime();
            };
            updateScoreAndSync();
        }
    }, [activeData, updateHealthScore, updateSyncTime, riskPersonality, isConnected]);

    // Load trend data when wallet is connected
    useEffect(() => {
        const loadTrends = async () => {
            if (!account) return;

            setIsLoadingTrends(true);
            try {
                const trends = await insightHistoryService.getTrendData(account, 30);
                setTrendData(trends);
            } catch (error) {
                console.error('Failed to load trends:', error);
            } finally {
                setIsLoadingTrends(false);
            }
        };

        if (activeTab === 'trends') {
            loadTrends();
        }
    }, [account, activeTab]);

    const handleGenerateAnalysis = async () => {
        if (!activeData) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await aiService.generatePortfolioAnalysis(activeData, {
                riskPersonality,
                learningMode,
                notifications,
                healthScore: activity.healthScore,
                insightMode
            });
            setAnalysis(result);
            if (isConnected) updateAIInsightTime();

            // Auto-save to history only if connected
            if (isConnected && account) {
                try {
                    await insightHistoryService.saveInsight(
                        account,
                        result,
                        activeData
                    );
                    console.log('✅ Insight saved to history');

                    // Reload trends if on trends tab
                    if (activeTab === 'trends') {
                        const trends = await insightHistoryService.getTrendData(account, 30);
                        setTrendData(trends);
                    }
                } catch (saveError) {
                    console.warn('Failed to save insight to history:', saveError);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate analysis');
        } finally {
            setIsGenerating(false);
        }
    };

    // Re-generate if mode changes and we already have analysis
    useEffect(() => {
        if (analysis && !isGenerating) {
            handleGenerateAnalysis();
        }
    }, [insightMode]);


    const getRiskColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'low': return 'text-success bg-success/10 border-success/20';
            case 'medium': return 'text-warning bg-warning/10 border-warning/20';
            case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
            default: return 'text-muted-foreground';
        }
    };

    const getOutlookColor = (outlook: string) => {
        switch (outlook.toLowerCase()) {
            case 'great': return 'text-success';
            case 'good': return 'text-success/80';
            case 'neutral': return 'text-warning';
            case 'caution': return 'text-destructive';
            default: return 'text-muted-foreground';
        }
    };

    if (isWalletLoading && isConnected) {
        return (
            <div className="min-h-screen py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 pb-20 relative">
            {/* Demo Mode Banner */}
            {!isConnected && (
                <div className="absolute top-0 left-0 right-0 bg-primary/5 py-1 text-center border-b border-primary/10 mb-4 z-10">
                    <p className="text-xs text-primary font-medium">✨ Viewing Demo Portfolio. Connect wallet to see your live data.</p>
                </div>
            )}

            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${!isConnected ? 'pt-8' : ''}`}>
                {/* Header */}
                <div className="mb-8 pl-1">
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
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'trends')} className="space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="current" className="flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                Current Analysis
                            </TabsTrigger>
                            <TabsTrigger value="trends" className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Trends
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="current" className="space-y-6">
                            {!analysis ? (
                                <div className="glass-card p-12 text-center relative overflow-hidden">
                                    {/* Decoration */}
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-accent/5 to-transparent blur-3xl" />

                                    <div className="relative z-10">
                                        <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
                                        <h2 className="text-2xl font-bold mb-3">Ready to Analyze Your Portfolio</h2>
                                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                                            Our AI will analyze your {activeData.balances.length} assets across {activeData.connectedChains} chains to provide optimization strategies, risk assessment, and detailed recommendations.
                                        </p>

                                        <div className="flex justify-center gap-4 mb-8">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm font-medium text-muted-foreground">Select Insight Mode</span>
                                                <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg">
                                                    {(['Market-Based', 'Wallet-Based', 'Risk-Focused'] as const).map((mode) => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => setInsightMode(mode)}
                                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${insightMode === mode
                                                                ? 'bg-accent text-accent-foreground shadow-sm'
                                                                : 'hover:bg-secondary/50 text-muted-foreground'
                                                                }`}
                                                        >
                                                            {mode.split('-')[0]}
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
                                            <p className="mt-4 text-destructive flex items-center justify-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                    {/* Mode Toggle Bar */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center bg-secondary/20 p-4 rounded-xl border border-white/5 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-accent" />
                                            <span className="font-semibold text-lg">AI Insight Mode:</span>
                                        </div>
                                        <div className="flex gap-2 bg-background/50 p-1 rounded-lg">
                                            {(['Market-Based', 'Wallet-Based', 'Risk-Focused'] as const).map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setInsightMode(mode)}
                                                    disabled={isGenerating}
                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${insightMode === mode
                                                        ? 'bg-accent text-accent-foreground shadow-md'
                                                        : 'hover:bg-secondary/50 text-muted-foreground'
                                                        }`}
                                                >
                                                    {isGenerating && insightMode === mode ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                                                    {mode.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Top Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-success/50 to-transparent" />
                                            <span className="text-muted-foreground mb-2 flex items-center gap-2">
                                                Portfolio Health
                                                <InfoIcon className="w-4 h-4 text-muted-foreground/50" />
                                            </span>
                                            <div className="relative w-28 h-28 flex items-center justify-center my-2">
                                                <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                                                    <circle cx="56" cy="56" r="48" className="stroke-secondary/30" strokeWidth="8" fill="none" />
                                                    <circle
                                                        cx="56" cy="56" r="48"
                                                        className="stroke-success transition-all duration-1000 ease-out"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeDasharray={301.6}
                                                        strokeDashoffset={301.6 - (301.6 * analysis.healthScore) / 100}
                                                    />
                                                </svg>
                                                <span className="absolute text-3xl font-bold tracking-tight">{analysis.healthScore}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                                {analysis.analysis.performance}
                                            </p>
                                        </div>

                                        <div className="glass-card p-6 flex flex-col relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/50 to-transparent" />
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-muted-foreground">Risk Profile</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskColor(analysis.riskLevel)}`}>
                                                    {analysis.riskLevel} Risk
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-warning" />
                                                Risk Drivers
                                            </h4>
                                            <ul className="space-y-2 mb-2 flex-1">
                                                {analysis.riskFactors?.slice(0, 3).map((factor, i) => (
                                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                                                        {factor}
                                                    </li>
                                                )) || <li className="text-sm text-muted-foreground">Analysis pending...</li>}
                                            </ul>
                                        </div>

                                        <div className="glass-card p-6 relative overflow-hidden bg-gradient-to-br from-accent/5 to-transparent">
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                <StarIcon className="w-24 h-24 text-accent" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                                <div className="p-2 bg-accent/10 rounded-lg">
                                                    <StarIcon className="w-5 h-5 text-accent" />
                                                </div>
                                                <span className="font-semibold text-lg">AI Top Pick</span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2 relative z-10">{analysis.topPick.asset}</h3>
                                            <p className="text-sm text-muted-foreground relative z-10">
                                                {analysis.topPick.reason}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Analysis & Summary */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 glass-card p-8">
                                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <Brain className="w-6 h-6 text-primary" />
                                                Advisor Summary
                                            </h3>

                                            <div className="prose prose-invert max-w-none">
                                                {analysis.summary.split('\n').map((line, i) => {
                                                    if (line.startsWith('###')) {
                                                        return <h4 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{line.replace('###', '').trim()}</h4>;
                                                    }
                                                    return <p key={i} className="text-muted-foreground leading-relaxed mb-2">{line}</p>;
                                                })}
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-border/50">
                                                <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                                                    <GlobeIcon className="w-4 h-4 text-accent" />
                                                    Cross-Chain Outlook
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {analysis.chainOutlook?.map((item, i) => (
                                                        <div key={i} className="p-4 rounded-xl bg-secondary/10 border border-white/5 flex items-center justify-between">
                                                            <div>
                                                                <span className="font-medium block mb-1">{item.chain}</span>
                                                                <span className="text-xs text-muted-foreground">{item.reason}</span>
                                                            </div>
                                                            <span className={`text-sm font-bold ${getOutlookColor(item.outlook)}`}>
                                                                {item.outlook}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recommendations */}
                                        <div className="glass-card p-6 flex flex-col h-full">
                                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                <History className="w-5 h-5 text-accent" />
                                                Action Plan
                                            </h3>
                                            <div className="space-y-4 flex-1">
                                                {analysis.recommendations.map((rec, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-secondary/10 border border-border/50 hover:bg-secondary/20 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{rec.asset}</span>
                                                                {rec.confidence && (
                                                                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${rec.confidence === 'High' ? 'border-success/30 text-success' : 'border-muted-foreground/30 text-muted-foreground'
                                                                        }`}>
                                                                        {rec.confidence} Conf.
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${rec.type === 'Buy' ? 'bg-success/20 text-success' :
                                                                rec.type === 'Sell' ? 'bg-destructive/20 text-destructive' :
                                                                    'bg-warning/20 text-warning'
                                                                }`}>
                                                                {rec.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                                                        {rec.timeHorizon && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
                                                                <ClockIcon className="w-3 h-3" />
                                                                {rec.timeHorizon}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-border/10 text-center">
                                                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-1">
                                                    Disclaimer
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 leading-tight">
                                                    AI insights are generated using on-chain wallet data and public market APIs. This is not financial advice.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="trends" className="space-y-6">
                            <TrendCharts
                                trendData={trendData || {
                                    healthScoreTrend: [],
                                    riskTrend: [],
                                    valueTrend: [],
                                    timestamps: [],
                                    dataPoints: 0
                                }}
                                isLoading={isLoadingTrends}
                            />
                        </TabsContent>
                    </Tabs>
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

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}

function GlobeIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
