import { useState, useEffect } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { rebalanceService } from '@/services/rebalanceService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, AlertTriangle, RefreshCw, Loader2, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#627EEA', '#2775CA', '#8247E5', '#F7931A'];

export default function RebalancePage() {
    const { isConnected } = useWallet();
    const { data: portfolioData, mode, isLoading } = usePortfolioData();
    const { toast } = useToast();

    // Target profiles
    const PROFILES = {
        CONSERVATIVE: { ETH: 30, USDC: 70 },
        BALANCED: { ETH: 50, USDC: 50 },
        AGGRESSIVE: { ETH: 70, USDC: 30 }
    };

    const [selectedProfile, setSelectedProfile] = useState<keyof typeof PROFILES>('BALANCED');
    const [rebalancePlan, setRebalancePlan] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const calculateDrift = () => {
        if (!portfolioData || !portfolioData.assets) return 0;
        const target = PROFILES[selectedProfile];
        const ethAsset = portfolioData.assets.find(a => a.symbol === 'ETH');
        const currentEthAlloc = ethAsset ? ethAsset.allocation : 0;
        const drift = Math.abs(currentEthAlloc - target.ETH);
        return drift;
    };

    const drift = calculateDrift();
    const needsRebalance = drift > 10;

    const handleAnalyze = async () => {
        if (!portfolioData) return;
        setIsAnalyzing(true);
        try {
            const balances: Record<string, number> = {};
            const prices: Record<string, number> = {};
            portfolioData.assets.forEach(a => {
                balances[a.symbol] = a.balance;
                prices[a.symbol] = a.price;
            });

            const plan = rebalanceService.calculatePlan(balances, prices, PROFILES[selectedProfile]);
            setRebalancePlan(plan);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (portfolioData && !rebalancePlan) {
            handleAnalyze();
        }
    }, [portfolioData, selectedProfile]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 pb-20 px-4 relative pt-16">
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

            <div className={`max-w-7xl mx-auto ${mode !== 'LIVE' ? 'pt-8' : ''}`}>
                <div className="mb-8 pl-1">
                    <h1 className="text-3xl font-bold font-heading flex items-center gap-3 mb-2">
                        <RefreshCw className="w-8 h-8 text-accent" />
                        Smart Rebalance
                    </h1>
                    <p className="text-muted-foreground">AI-driven portfolio optimization based on your target allocation profile.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6 border-l-4 border-l-accent">
                        <span className="text-muted-foreground text-sm uppercase tracking-wider">Health Score</span>
                        <div className="text-4xl font-bold mt-2 flex items-baseline gap-2">
                            {portfolioData?.riskScore || 50}
                            <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                        </div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-l-warning">
                        <span className="text-muted-foreground text-sm uppercase tracking-wider">Allocation Drift</span>
                        <div className="text-4xl font-bold mt-2 flex items-baseline gap-2">
                            {drift.toFixed(1)}%
                        </div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-l-success">
                        <span className="text-muted-foreground text-sm uppercase tracking-wider">Status</span>
                        <div className="text-xl font-bold mt-2 flex items-center gap-2">
                            {needsRebalance ? (
                                <>
                                    <AlertTriangle className="w-6 h-6 text-warning" />
                                    Rebalance Needed
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-6 h-6 text-success" />
                                    Optimized
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-accent" />
                        Target Profile Selection
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.keys(PROFILES).map((p) => (
                            <button
                                key={p}
                                onClick={() => setSelectedProfile(p as any)}
                                className={`p-4 rounded-xl border transition-all ${
                                    selectedProfile === p 
                                    ? 'bg-accent/10 border-accent text-accent' 
                                    : 'bg-secondary/20 border-white/5 text-muted-foreground hover:bg-secondary/40'
                                }`}
                            >
                                <div className="font-bold uppercase mb-1">{p}</div>
                                <div className="text-xs">
                                    {PROFILES[p as keyof typeof PROFILES].ETH}% ETH / {PROFILES[p as keyof typeof PROFILES].USDC}% USDC
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {rebalancePlan && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4 text-center">Current Allocation</h3>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={portfolioData.assets}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="allocation"
                                                nameKey="symbol"
                                            >
                                                {portfolioData.assets.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '8px', border: 'none' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4 text-center text-success">Target Allocation</h3>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(PROFILES[selectedProfile]).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {Object.entries(PROFILES[selectedProfile]).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '8px', border: 'none' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <ArrowRightLeft className="w-6 h-6 text-primary" />
                                Optimal Rebalance Plan
                            </h3>
                            
                            {rebalancePlan.requiredSwaps.length > 0 ? (
                                <div className="space-y-4">
                                    {rebalancePlan.requiredSwaps.map((swap: any, idx: number) => (
                                        <div key={idx} className="p-6 rounded-xl bg-secondary/10 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${swap.action === 'BUY' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                                                        {swap.action}
                                                    </span>
                                                    <span className="font-bold text-lg">{swap.asset}</span>
                                                </div>
                                                <p className="text-muted-foreground text-sm">Amount: {swap.amountToken.toFixed(4)} {swap.asset} (~${swap.amountUsd.toFixed(2)})</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="border-primary/50 text-primary hover:bg-primary/10"
                                                onClick={() => {
                                                    toast({
                                                        title: mode === 'DEMO' ? "Simulated swap" : "Transaction started",
                                                        description: `Executing ${swap.action} for ${swap.asset}.`
                                                    });
                                                }}
                                            >
                                                Execute {swap.action}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShieldCheck className="w-12 h-12 text-success mx-auto mb-4" />
                                    <h4 className="text-xl font-bold">Everything is in alignment</h4>
                                    <p className="text-muted-foreground mt-2">Your portfolio drift is below the 10% threshold.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
