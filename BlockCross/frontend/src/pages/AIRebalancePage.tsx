import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../contexts/ProfileContext';
import { useWalletBalances } from '../hooks/useWalletBalances';
import { useNetworkMode } from '../contexts/NetworkModeContext';
import { Loader2, ArrowRight, ShieldCheck, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { RebalanceAnalysis, RebalanceAction } from '../types/rebalance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

import { mockPortfolioData } from '@/data/mockData';

export default function AIRebalancePage() {
    const { account, isConnected } = useWallet();
    const { networkMode } = useNetworkMode();
    const { riskPersonality, notifications } = useProfile();
    const { data: portfolioData } = useWalletBalances({ address: account, networkMode });

    // DEMO DATA LOGIC
    const activeData = isConnected ? portfolioData : (mockPortfolioData as unknown as import('@/lib/walletService').PortfolioData);

    const [analysis, setAnalysis] = useState<RebalanceAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [executingId, setExecutingId] = useState<number | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            // In a real app, use the aiService or fetch directly
            // Using direct fetch for now based on our backend implementation
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/rebalance/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolio: activeData,
                    userProfile: { riskPersonality }
                })
            });
            const data = await response.json();
            setAnalysis(data);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-analyze on load if data is ready
    useEffect(() => {
        if (activeData && !analysis) {
            handleAnalyze();
        }
    }, [activeData]);

    const handleExecute = async (action: RebalanceAction) => {
        if (!isConnected) {
            alert("Please connect your wallet to execute trades.");
            return;
        }

        setExecutingId(action.id);
        // Mock execution delay
        await new Promise(r => setTimeout(r, 2000));
        alert(`Successfully executed: ${action.action} ${action.amount} ${action.asset}`);
        setExecutingId(null);

        // Optimistic update: remove action
        if (analysis) {
            setAnalysis({
                ...analysis,
                actions: analysis.actions.filter(a => a.id !== action.id)
            });
        }
    };

    if (!activeData && !account) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 glass-card">
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-muted-foreground">Please connect your wallet to access AI Rebalancing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 pb-20 px-4 relative">
            {/* Demo Mode Banner */}
            {!isConnected && (
                <div className="absolute top-0 left-0 right-0 bg-primary/5 py-1 text-center border-b border-primary/10 mb-4 z-10">
                    <p className="text-xs text-primary font-medium">✨ Viewing Demo Portfolio. Connect wallet to see your live data.</p>
                </div>
            )}

            <div className={`max-w-7xl mx-auto ${!isConnected ? 'pt-8' : ''}`}>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-accent" />
                        Smart Rebalance
                    </h1>
                    <p className="text-muted-foreground">AI-driven portfolio optimization based on your {riskPersonality} profile.</p>
                </div>

                {isLoading && !analysis ? (
                    <div className="flex flex-col items-center justify-center p-20 glass-card">
                        <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                        <h3 className="text-xl font-bold">Analyzing Portfolio Structure...</h3>
                        <p className="text-muted-foreground">Calculating optimal allocation and identifying drift.</p>
                    </div>
                ) : analysis ? (
                    <div className="space-y-8">
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 border-l-4 border-l-accent">
                                <span className="text-muted-foreground text-sm uppercase tracking-wider">Health Score</span>
                                <div className="text-4xl font-bold mt-2 flex items-baseline gap-2">
                                    {analysis.healthScore}
                                    <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                                </div>
                            </div>
                            <div className="glass-card p-6 border-l-4 border-l-warning">
                                <span className="text-muted-foreground text-sm uppercase tracking-wider">Risk Score</span>
                                <div className="text-4xl font-bold mt-2 flex items-baseline gap-2">
                                    {analysis.riskScore}
                                    <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                                </div>
                            </div>
                            <div className="glass-card p-6 border-l-4 border-l-success">
                                <span className="text-muted-foreground text-sm uppercase tracking-wider">Drift Status</span>
                                <div className="text-xl font-bold mt-2 flex items-center gap-2">
                                    {analysis.driftDetected ? (
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

                        {/* Explanation */}
                        <div className="glass-card p-6 bg-accent/5">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent" />
                                AI Assessment
                            </h3>
                            <p className="leading-relaxed">{analysis.explanation}</p>
                        </div>

                        {/* Allocation Visualizer */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4 text-center">Current Allocation</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(analysis.currentAllocation).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {Object.entries(analysis.currentAllocation).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="glass-card p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <ShieldCheck className="w-32 h-32" />
                                </div>
                                <h3 className="text-lg font-bold mb-4 text-center text-success">Target Allocation ({riskPersonality})</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(analysis.targetAllocation).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {Object.entries(analysis.targetAllocation).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Action Plan */}
                        {analysis.actions.length > 0 && (
                            <div className="glass-card p-8">
                                <h3 className="text-2xl font-bold mb-6">Recommended Actions</h3>
                                <div className="grid gap-4">
                                    {analysis.actions.map((action) => (
                                        <div key={action.id} className="group relative overflow-hidden rounded-xl bg-secondary/10 border border-white/5 hover:bg-secondary/20 transition-all duration-300">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${action.action === 'Buy' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                                                            }`}>
                                                            {action.action}
                                                        </span>
                                                        <span className="font-bold text-lg">{action.asset}</span>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm">{action.reason}</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <span className="block text-sm text-muted-foreground">Value</span>
                                                        <span className="font-mono font-bold">${action.valueUsd.toLocaleString()}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleExecute(action)}
                                                        disabled={executingId === action.id}
                                                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {executingId === action.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                Execute <ArrowRight className="w-4 h-4" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 glass-card">
                        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold">No Analysis Available</h3>
                        <p className="text-muted-foreground mb-6">Could not generate rebalancing insights. Please try again.</p>
                        <button
                            onClick={handleAnalyze}
                            className="px-6 py-2 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90"
                        >
                            Retry Analysis
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
