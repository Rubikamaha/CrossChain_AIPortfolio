import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Fuel, RefreshCw, TrendingUp, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import type { PortfolioData } from '@/lib/walletService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Opportunity {
    id: string;
    type: 'gas' | 'rebalance' | 'yield' | 'trend';
    title: string;
    description: string;
    actionLabel: string;
    impact?: string;
}

interface OpportunityFeedProps {
    portfolioData?: PortfolioData | null;
    networkMode?: 'mainnet' | 'testnet';
}

export function OpportunityFeed({ portfolioData, networkMode = 'mainnet' }: OpportunityFeedProps) {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRealDataAndAnalyze = async () => {
            setIsLoading(true);
            const newOps: Opportunity[] = [];

            try {
                // 1. Fetch Gas Prices via Backend RPC Proxy
                // If Testnet -> Check Sepolia (11155111)
                // If Mainnet -> Check ETH (1) and Polygon (137)

                const fetchGas = async (chainId: number) => {
                    try {
                        const res = await fetch(`${BACKEND_URL}/rpc`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chainId, method: 'eth_gasPrice' })
                        });
                        const data = await res.json();
                        return data.result ? parseInt(data.result, 16) / 1e9 : null; // returns Gwei
                    } catch (e) {
                        console.error("Gas fetch error", e);
                        return null;
                    }
                };

                const gasCheckIds = networkMode === 'testnet' ? [11155111] : [1, 137];
                const gasResults = await Promise.all(gasCheckIds.map(id => fetchGas(id)));

                // 2. Fetch Market Trends (BTC, ETH) via Backend Price API
                // Irrelevant of network mode, market data is usually Mainnet driven
                let ethChange = 0;
                try {
                    const priceRes = await fetch(`${BACKEND_URL}/api/prices?ids=ethereum,bitcoin`);
                    const priceData = await priceRes.json();
                    if (priceData.ethereum) {
                        ethChange = priceData.ethereum.usd_24h_change || 0;
                    }
                } catch (e) { console.error("Price fetch error", e); }

                // --- ANALYZE LOGIC ---

                // A. Gas Opportunities
                if (networkMode === 'mainnet') {
                    const ethGas = gasResults[0];
                    const polyGas = gasResults[1];

                    if (ethGas && ethGas < 20) {
                        newOps.push({
                            id: 'gas-low-main',
                            type: 'gas',
                            title: 'Low ETH Gas Fees',
                            description: `Mainnet gas is only ~${ethGas.toFixed(1)} gwei. Excellent time to bridge or swap.`,
                            actionLabel: 'Execute Now',
                            impact: 'Save Costs'
                        });
                    } else if (polyGas && polyGas > 300) {
                        newOps.push({
                            id: 'gas-high-poly',
                            type: 'gas',
                            title: 'Polygon Congested',
                            description: `Polygon fees are high (~${polyGas.toFixed(0)} gwei). Consider waiting or using L2s.`,
                            actionLabel: 'Wait',
                            impact: 'Avoid Fees'
                        });
                    }
                } else {
                    // Testnet Logic
                    const sepoliaGas = gasResults[0];
                    if (sepoliaGas && sepoliaGas > 50) { // arbitrary high for testnet
                        newOps.push({
                            id: 'gas-high-sep',
                            type: 'gas',
                            title: 'Sepolia Congestion',
                            description: `Sepolia testnet gas is unusually high (~${sepoliaGas.toFixed(1)} gwei). Faucet might be empty.`,
                            actionLabel: 'Check Faucet',
                            impact: 'Info'
                        });
                    } else {
                        newOps.push({
                            id: 'gas-low-sep',
                            type: 'gas',
                            title: 'Sepolia Smooth',
                            description: `Testnet conditions are good (~${sepoliaGas?.toFixed(1) || '0'} gwei). Ready for testing.`,
                            actionLabel: 'Test Swap',
                            impact: 'Good Condition'
                        });
                    }
                }

                // B. Market Trends
                if (Math.abs(ethChange) > 4) {
                    newOps.push({
                        id: 'market-volatility',
                        type: 'trend',
                        title: ethChange > 0 ? 'ETH Rallying' : 'ETH Dipping',
                        description: `Ethereum is ${ethChange > 0 ? 'up' : 'down'} ${ethChange.toFixed(1)}% in 24h. ${ethChange > 0 ? 'Good momentum.' : 'Buy the dip?'}`,
                        actionLabel: 'View Market',
                        impact: ethChange > 0 ? 'Bullish' : 'High Volatility'
                    });
                }

                // C. Portfolio Analysis (Client Side)
                if (portfolioData && portfolioData.totalValue > 0) {
                    const stableCoins = ['USDC', 'USDT', 'DAI'];
                    const stableValue = portfolioData.balances
                        .filter(b => stableCoins.some(s => b.symbol.includes(s)))
                        .reduce((acc, curr) => acc + (curr.usdValue || 0), 0);

                    const stableRatio = stableValue / portfolioData.totalValue;

                    if (stableRatio < 0.05) {
                        newOps.push({
                            id: 'rebalance-stable',
                            type: 'rebalance',
                            title: 'Low Stablecoin Reserves',
                            description: `Stablecoins makeup < ${(stableRatio * 100).toFixed(0)}% of your portfolio. Consider taking profits into USDC.`,
                            actionLabel: 'Rebalance',
                            impact: 'Reduce Risk'
                        });
                    } else if (stableRatio > 0.5 && ethChange > 0) {
                        newOps.push({
                            id: 'deploy-capital',
                            type: 'yield',
                            title: 'High Cash Drag',
                            description: 'You are heavy on stables while the market is rallying. Consider deploying capital.',
                            actionLabel: 'Invest',
                            impact: 'Capture Growth'
                        });
                    }
                }

                // Fallback if no specific insights found (so it's not empty)
                if (newOps.length === 0) {
                    newOps.push({
                        id: 'default-scan',
                        type: 'trend',
                        title: 'Portfolio Stable',
                        description: 'No critical alerts detected in your portfolio or gas markets right now.',
                        actionLabel: 'Scan Again',
                        impact: 'All Good'
                    });
                }

            } catch (err) {
                console.error("Analysis failed", err);
            } finally {
                setOpportunities(newOps);
                setIsLoading(false);
            }
        };

        fetchRealDataAndAnalyze();
    }, [portfolioData, networkMode]);

    const getIcon = (type: Opportunity['type']) => {
        switch (type) {
            case 'gas': return <Fuel className="w-5 h-5 text-blue-400" />;
            case 'rebalance': return <RefreshCw className="w-5 h-5 text-amber-400" />;
            case 'yield': return <Zap className="w-5 h-5 text-yellow-400" />;
            case 'trend': return <TrendingUp className="w-5 h-5 text-green-400" />;
        }
    };

    return (
        <Card className="glass-card w-full mb-8 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        AI Opportunity Feed
                        <span className="text-xs font-normal text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-background/50 border border-border">
                            {isLoading ? 'Scanning...' : 'Live Analysis'}
                        </span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsLoading(true)}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="h-16 w-full rounded-xl bg-muted/20 animate-pulse flex items-center px-4 gap-4">
                            <div className="w-8 h-8 rounded-full bg-muted/40" />
                            <div className="space-y-1 flex-1">
                                <div className="h-3 w-1/3 bg-muted/40 rounded" />
                                <div className="h-2 w-1/2 bg-muted/40 rounded" />
                            </div>
                        </div>
                        <div className="h-16 w-full rounded-xl bg-muted/10 animate-pulse flex items-center px-4 gap-4 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-muted/40" />
                            <div className="space-y-1 flex-1">
                                <div className="h-3 w-1/4 bg-muted/40 rounded" />
                                <div className="h-2 w-1/3 bg-muted/40 rounded" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {opportunities.map((op) => (
                            <div key={op.id} className="relative p-4 rounded-xl bg-background/40 hover:bg-background/60 border border-border/50 hover:border-primary/30 transition-all group flex flex-col justify-between min-h-[140px]">
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 rounded-lg bg-background shadow-sm border border-border/50">
                                            {getIcon(op.type)}
                                        </div>
                                        {op.impact && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
                                                {op.impact}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-sm mb-1">{op.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {op.description}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border/30 flex justify-end">
                                    <span className="text-xs font-medium text-primary cursor-pointer hover:underline flex items-center gap-1">
                                        {op.actionLabel}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
