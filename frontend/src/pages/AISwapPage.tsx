import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { parseSwapCommand, executeSwap, type ParsedSwap } from '@/lib/swapService';
import { Loader2, Send, ArrowRight, Wallet, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AISwapPage() {
    const { isConnected, account, connect } = useWallet();
    const { toast } = useToast();
    const [command, setCommand] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
        { role: 'ai', content: 'Hello! I am your AI Swap Agent. Tell me what you want to trade, e.g., "Swap 0.1 ETH for USDC"' }
    ]);
    const [pendingSwap, setPendingSwap] = useState<ParsedSwap | null>(null);

    const handleParse = async () => {
        if (!command.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user' as const, content: command }];
        setMessages(newMessages);
        const cmd = command;
        setCommand('');
        setIsThinking(true);
        setPendingSwap(null);

        try {
            if (!isConnected) {
                setMessages([...newMessages, { role: 'ai', content: 'Please connect your wallet first.' }]);
                setIsThinking(false);
                return;
            }

            const result = await parseSwapCommand(cmd, account || '');

            if (result.error || result.action === 'error') {
                setMessages(prev => [...prev, { role: 'ai', content: `I couldn't understand that. ${result.error || 'Please try again.'}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: result.explanation }]);
                setPendingSwap(result);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error providing that analysis.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleExecute = async () => {
        if (!pendingSwap || !account) return;
        setIsExecuting(true);
        try {
            const txHash = await executeSwap(pendingSwap, account);
            toast({
                title: "Swap Submitted",
                description: `Transaction pending: ${txHash.slice(0, 10)}...`,
                variant: "success"
            });
            setMessages(prev => [...prev, { role: 'ai', content: `✅ Usage executed! Tx Hash: ${txHash}` }]);
            setPendingSwap(null);
        } catch (e: any) {
            console.error(e);
            toast({
                title: "Swap Failed",
                description: e.message || "User rejected or failed",
                variant: "destructive"
            });
            setMessages(prev => [...prev, { role: 'ai', content: `❌ Execution failed: ${e.message}` }]);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar isConnected={isConnected} onConnect={connect} account={account} />
            <div className="pt-24 max-w-4xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Chat Section */}
                    <Card className="glass-card h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🤖</span> AI Swap Agent
                            </CardTitle>
                            <CardDescription>Natural Language Execution Engine</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-xl max-w-[80%] text-sm ${m.role === 'user'
                                                ? 'bg-primary/20 text-primary-foreground rounded-tr-none'
                                                : 'bg-muted rounded-tl-none'
                                            }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-xl rounded-tl-none flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder='Type "Swap 0.001 ETH for UNI"...'
                                    value={command}
                                    onChange={e => setCommand(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleParse()}
                                    disabled={isThinking || isExecuting}
                                    className="glass-input"
                                />
                                <Button onClick={handleParse} disabled={isThinking || isExecuting || !command.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Section */}
                    <div className="space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Swap Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingSwap ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold">{pendingSwap.amount}</div>
                                                <div className="text-sm text-muted-foreground font-bold">{pendingSwap.tokenIn}</div>
                                            </div>
                                            <ArrowRight className="text-muted-foreground" />
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-muted-foreground">?</div>
                                                <div className="text-sm text-muted-foreground font-bold">{pendingSwap.tokenOut}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Action</span>
                                                <span className="font-mono font-bold text-primary uppercase">{pendingSwap.action}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Est. Network</span>
                                                <span className="text-foreground">Sepolia / Testnet</span>
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full h-12 text-lg font-bold gap-2"
                                            variant="secondary"
                                            onClick={handleExecute}
                                            disabled={isExecuting}
                                        >
                                            {isExecuting ? <Loader2 className="animate-spin" /> : <Wallet className="w-5 h-5" />}
                                            {isExecuting ? 'Confirming...' : 'Sign & Swap'}
                                        </Button>

                                        <div className="flex gap-2 items-start p-3 rounded bg-amber-500/10 border border-amber-500/20">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                            <p className="text-xs text-amber-500/90 leading-relaxed">
                                                This is a BETA feature executing on Testnets.
                                                Ensure you are connected to Sepolia and have sufficient gas.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-xl">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 opacity-50">
                                            <ArrowRight className="w-6 h-6" />
                                        </div>
                                        <p>No swap pending</p>
                                        <p className="text-sm opacity-50">Use the chat to create an order</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
