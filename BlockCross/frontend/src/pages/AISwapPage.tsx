// frontend/src/pages/AISwapPage.tsx
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { getAISwapQuote, executeSwap, formatPrice, type AISwapQuote } from '@/lib/swapService';
import {
    Loader2,
    Send,
    ArrowRightLeft,
    Wallet,
    CheckCircle,
    AlertTriangle,
    Brain,
    Zap,
    ShieldCheck,
    ArrowDown,
    Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AISwapPage() {
    const { isConnected, account, connect } = useWallet();
    const { toast } = useToast();
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [quote, setQuote] = useState<AISwapQuote | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Mock analysis for when wallet is not connected
    useEffect(() => {
        if (!isConnected && !quote && !isProcessing) {
            setQuote({
                success: true,
                is_mock: true,
                parsed_intent: {
                    from_token: "ETH",
                    to_token: "USDC",
                    amount_type: "token",
                    amount_value: 0.5
                },
                user_balances: { ETH: 1.2, USDC: 500 },
                token_prices: { ETH: 3200, USDC: 1 },
                swap_amount: 0.5,
                from_token: "ETH",
                to_token: "USDC",
                expected_receive: 1600,
                price: 3200,
                guaranteed_price: 3168,
                price_impact: 0.05,
                gas_estimate: "21000",
                gas_estimate_eth: 0.005,
                allowance_target: null,
                tx_data: null,
                sources: [{ name: "Uniswap V3", proportion: 1 }],
                slippage: "1%"
            });
        } else if (isConnected && quote?.is_mock) {
            setQuote(null);
        }
    }, [isConnected]);

    const handleAction = async () => {
        if (!command.trim()) return;

        setIsProcessing(true);
        setError(null);
        setQuote(null);

        try {
            const result = await getAISwapQuote(command, account);
            setQuote(result);
            setCommand('');
        } catch (err: any) {
            setError(err.message || 'Failed to process command');
            toast({
                title: "AI Parsing Failed",
                description: err.message || "Please check your command and try again.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExecute = async () => {
        if (!quote || !account || quote.is_mock) return;

        setIsExecuting(true);
        try {
            const txHash = await executeSwap(quote.tx_data, account);
            toast({
                title: "Swap Executed",
                description: `Transaction hash: ${txHash.slice(0, 10)}...`,
            });
            setQuote(null);
            setCommand('');
        } catch (e: any) {
            console.error(e);
            toast({
                title: "Execution Error",
                description: e.message || "Failed to execute transaction",
                variant: "destructive"
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">
            <Navbar isConnected={isConnected} onConnect={connect} account={account} />

            {/* Background Glows */}
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="pt-32 max-w-5xl mx-auto px-4 relative z-10">

                {/* Hero Header */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-4 uppercase tracking-widest">
                        <Zap className="w-3 h-3" /> AI-Powered Execution
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                        AI Swap <span className="gradient-text">Assistant</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Execute trades using natural language. Fast, secure, and optimized for ETH and USDC on Mainnet.
                    </p>
                </div>

                {/* Input Section */}
                <div className="max-w-3xl mx-auto mb-12">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <Brain className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder='e.g., "Swap 0.5 ETH to USDC" or "Convert half of my ETH"'
                                    value={command}
                                    onChange={e => setCommand(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAction()}
                                    disabled={isProcessing || isExecuting}
                                    className="h-14 pl-12 pr-4 text-lg glass-card border-white/10 group-focus-within:border-primary/50 transition-all font-medium"
                                />
                            </div>
                            <Button
                                onClick={handleAction}
                                size="lg"
                                disabled={isProcessing || isExecuting || !command.trim()}
                                className="h-14 px-8 font-bold text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {isProcessing ? 'Analyzing...' : 'Parse intent'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {['Swap 0.2 ETH', 'Sell 25% ETH', 'Buy $1000 USDC'].map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => setCommand(suggestion)}
                                className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Side: Instructions & Info */}
                    <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-left-4 duration-700">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-primary" /> Security Rules
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <RuleItem text="No auto-execution: Always preview before signing." />
                                    <RuleItem text="Limited Assets: Supports ETH and USDC ONLY." />
                                    <RuleItem text="Slippage Guard: 1% maximum slippage on all trades." />
                                    <RuleItem text="Direct DEX Route: Uses 0x aggregation for best prices." />
                                </div>
                                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                                    <div className="flex gap-3">
                                        <Zap className="w-5 h-5 text-accent shrink-0" />
                                        <p className="text-xs text-accent-foreground/80 leading-relaxed font-medium">
                                            Our AI engine uses Gemini 2.0 Flash to extract intent with high precision, ensuring your specific trading instructions are mapped correctly to smart contract calls.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {quote && quote.is_mock && !isConnected && (
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex gap-3 animate-pulse">
                                <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Demo Mode Active</h4>
                                    <p className="text-[11px] text-muted-foreground">Connect your wallet to get live mainnet quotes and execute real trades.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Preview & Quote */}
                    <div className="lg:col-span-7 animate-in slide-in-from-right-4 duration-700">
                        {quote ? (
                            <Card className="glass-card border-primary/20 shadow-2xl shadow-primary/5">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-2xl">Swap Preview</CardTitle>
                                        <div className="px-2 py-1 rounded bg-secondary text-[10px] font-black tracking-widest uppercase">
                                            {quote.is_mock ? 'SIMULATED' : 'LIVE MAINNET'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">

                                    {/* Action Flow Visualizer */}
                                    <div className="relative">
                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            <div className="p-4 h-32 rounded-2xl bg-secondary/30 border border-white/5 flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Selling</span>
                                                <span className="text-3xl font-black mb-1">{quote.swap_amount}</span>
                                                <span className="text-xs font-bold text-primary">{quote.from_token}</span>
                                            </div>
                                            <div className="p-4 h-32 rounded-2xl bg-secondary/30 border border-white/5 flex flex-col items-center justify-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Buying</span>
                                                <span className="text-3xl font-black mb-1">{quote.expected_receive.toLocaleString(undefined, { maximumFractionDigits: quote.to_token === 'USDC' ? 2 : 6 })}</span>
                                                <span className="text-xs font-bold text-accent">{quote.to_token}</span>
                                            </div>
                                        </div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-lg">
                                            <ArrowRightLeft className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>

                                    {/* Quote Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <QuoteDetail label="Exchange Rate" value={formatPrice(quote.price, quote.from_token, quote.to_token)} />
                                        <QuoteDetail label="Price Impact" value={`${quote.price_impact ? (quote.price_impact * 100).toFixed(2) : '0.00'}%`} />
                                        <QuoteDetail
                                            label="Estimated Gas"
                                            value={quote.gas_estimate_eth ? `~${quote.gas_estimate_eth.toFixed(4)} ETH` : 'Calculating...'}
                                            icon={<Timer className="w-3 h-3" />}
                                        />
                                        <QuoteDetail label="Max Slippage" value={quote.slippage} />
                                    </div>

                                    {/* Best Source */}
                                    <div className="p-4 rounded-xl bg-secondary/20 border border-white/5">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Smart Routing</span>
                                            <span className="text-[10px] text-primary font-bold">OPTIMIZED</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {quote.sources.slice(0, 3).map((s, i) => (
                                                <div key={i} className="px-2 py-1 rounded-md bg-background/50 border border-border/50 text-xs font-medium">
                                                    {s.name} <span className="text-primary/70 ml-1">{(s.proportion * 100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <Button
                                            className="w-full h-14 text-lg font-black uppercase tracking-wider gap-3"
                                            size="lg"
                                            onClick={isConnected ? handleExecute : connect}
                                            disabled={isExecuting}
                                        >
                                            {isExecuting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                                            {!isConnected ? 'Connect Wallet to Swap' : (isExecuting ? 'Processing Transaction...' : 'Confirm & Execute Swap')}
                                        </Button>

                                        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                            <ShieldCheck className="w-3 h-3 text-success" /> Fully Non-Custodial
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 glass-card border-dashed border-2">
                                {isProcessing ? (
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                                            <Brain className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">Decoding Intent...</h3>
                                        <p className="text-muted-foreground animate-pulse">Our AI is analyzing your command and fetching the best market quotes.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 text-2xl">
                                            ⌨️
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Ready to trade?</h3>
                                        <p className="text-muted-foreground max-w-xs mx-auto">
                                            Enter a natural language command above to start. For example, "Swap 0.5 ETH for USDC".
                                        </p>
                                        <div className="mt-8 flex flex-col items-start gap-3 text-left max-w-xs mx-auto">
                                            <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Supported Tokens</p>
                                            <div className="flex gap-2">
                                                <TokenTag symbol="ETH" name="Ethereum" color="bg-primary/20 text-primary" />
                                                <TokenTag symbol="USDC" name="USD Coin" color="bg-blue-500/20 text-blue-400" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RuleItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(175,84%,52%)]" />
            <span className="text-sm font-medium text-muted-foreground/90">{text}</span>
        </div>
    );
}

function QuoteDetail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground mb-1">
                {icon} {label}
            </div>
            <div className="text-foreground font-bold">{value}</div>
        </div>
    );
}

function TokenTag({ symbol, name, color }: { symbol: string; name: string; color: string }) {
    return (
        <div className={`px-3 py-2 rounded-xl flex flex-col ${color}`}>
            <span className="text-sm font-black">{symbol}</span>
            <span className="text-[10px] font-bold opacity-80">{name}</span>
        </div>
    );
}
