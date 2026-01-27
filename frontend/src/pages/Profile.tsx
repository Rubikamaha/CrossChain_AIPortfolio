import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Shield, Settings, Bell, BarChart3, Info, ExternalLink, Brain, Target, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useProfile } from '@/contexts/ProfileContext';
import { openConnectModal, disconnect as walletDisconnect } from '@/lib/walletConnect';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const Profile = () => {
    const {
        riskPersonality, setRiskPersonality,
        preferredCurrency, setPreferredCurrency,
        learningMode, setLearningMode,
        notifications, toggleNotification,
        activity
    } = useProfile();

    const { toast } = useToast();
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [network, setNetwork] = useState<string | null>(null);
    const [provider, setProvider] = useState<string>('Unknown');

    useEffect(() => {
        const updateWalletInfo = async () => {
            // @ts-ignore
            const eth = (window as any).ethereum;
            if (eth) {
                if (eth.isMetaMask) setProvider('MetaMask');
                else if (eth.isWalletConnect) setProvider('WalletConnect');

                try {
                    const accounts = await eth.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        setAccount(accounts[0]);
                        setIsConnected(true);

                        const chainId = await eth.request({ method: 'eth_chainId' });
                        // Simple mapping or use a config
                        setNetwork(chainId === '0x1' ? 'Ethereum Mainnet' : `Chain ID: ${parseInt(chainId, 16)}`);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        updateWalletInfo();
    }, []);

    const handleDisconnect = async () => {
        try {
            await walletDisconnect();
            setIsConnected(false);
            setAccount(null);
            toast({ title: 'Wallet Disconnected' });
        } catch (err) {
            toast({ title: 'Disconnect failed', variant: 'destructive' });
        }
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    const formatDate = (dateStr: string | null) => dateStr ? new Date(dateStr).toLocaleString() : 'Never';

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-success';
        if (score >= 50) return 'text-warning';
        return 'text-destructive';
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar isConnected={isConnected} account={account} onConnect={openConnectModal} onDisconnect={handleDisconnect} />

            <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-heading font-bold gradient-text">User Profile</h1>
                    <p className="text-muted-foreground">Personalize your AI intelligence and manage secure wallet identity.</p>
                </header>

                {/* STEP 1: Wallet Information */}
                <section className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-heading font-semibold">Wallet Identity</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
                                <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Address</label>
                            <p className="font-mono">{account ? formatAddress(account) : 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Provider</label>
                            <p className="font-medium">{provider}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Current Network</label>
                            <p className="font-medium">{network || 'N/A'}</p>
                        </div>
                    </div>
                </section>

                {/* STEP 4: Portfolio Health Score */}
                <section className="glass-card p-6 space-y-4 bg-gradient-to-br from-secondary/5 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-heading font-semibold">Portfolio Health Score</h2>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" className="stroke-secondary" strokeWidth="8" fill="none" />
                                <circle
                                    cx="64" cy="64" r="58"
                                    className={`transition-all duration-1000 ease-out ${activity.healthScore >= 80 ? 'stroke-success' : activity.healthScore >= 50 ? 'stroke-warning' : 'stroke-destructive'}`}
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={364.4}
                                    strokeDashoffset={364.4 - (364.4 * activity.healthScore) / 100}
                                />
                            </svg>
                            <span className="absolute text-3xl font-bold">{activity.healthScore}</span>
                        </div>
                        <div className="flex-1 space-y-3 text-center md:text-left">
                            <h3 className="text-lg font-semibold">Understanding your score</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {activity.healthExplanation}
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="text-xs p-2 bg-secondary/30 rounded-lg">
                                    <span className="block font-bold">Diversification</span>
                                    <span className="text-muted-foreground">Asset spread</span>
                                </div>
                                <div className="text-xs p-2 bg-secondary/30 rounded-lg">
                                    <span className="block font-bold">Distribution</span>
                                    <span className="text-muted-foreground">Chain balance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* STEP 2: AI Risk Personality */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-heading font-semibold">Risk Personality</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">Choose a profile that directs how AI analyzes your risk and provides suggestions.</p>
                        <div className="grid gap-2">
                            {(['Conservative', 'Balanced', 'Aggressive'] as const).map(p => (
                                <Button
                                    key={p}
                                    variant={riskPersonality === p ? 'default' : 'outline'}
                                    className="justify-between w-full h-12 px-4 group"
                                    onClick={() => setRiskPersonality(p)}
                                >
                                    <span>{p}</span>
                                    {riskPersonality === p && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </Button>
                            ))}
                        </div>
                    </section>

                    {/* STEP 3: Learning Mode */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-heading font-semibold">Learning Mode</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">AI Insights will adapt its language and depth based on your selection.</p>
                        <div className="grid gap-2">
                            {(['Beginner', 'Expert'] as const).map(mode => (
                                <Button
                                    key={mode}
                                    variant={learningMode === mode ? 'default' : 'outline'}
                                    className="justify-between w-full h-12 px-4 group"
                                    onClick={() => setLearningMode(mode)}
                                >
                                    <div className="text-left">
                                        <span className="block font-medium">{mode} Mode</span>
                                        <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                                            {mode === 'Beginner' ? 'Simple explanations' : 'Technical depth'}
                                        </span>
                                    </div>
                                    {learningMode === mode && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </Button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* STEP 5: Notification Settings */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-heading font-semibold">Smart Alerts</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">High-risk asset alert</p>
                                    <p className="text-xs text-muted-foreground">Notify when an asset becomes risky.</p>
                                </div>
                                <Switch checked={notifications.highRiskAlert} onCheckedChange={() => toggleNotification('highRiskAlert')} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Portfolio imbalance alert</p>
                                    <p className="text-xs text-muted-foreground">Notify on significant chain deviations.</p>
                                </div>
                                <Switch checked={notifications.imbalanceAlert} onCheckedChange={() => toggleNotification('imbalanceAlert')} />
                            </div>
                        </div>
                    </section>

                    {/* STEP 4/Activity: Activity Summary */}
                    <section className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-heading font-semibold">Activity Summary</h2>
                        </div>
                        <div className="grid gap-4">
                            <div className="surface p-4 rounded-xl flex justify-between items-center">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Last Sync</span>
                                <span className="text-sm font-medium">{formatDate(activity.lastSyncTime)}</span>
                            </div>
                            <div className="surface p-4 rounded-xl flex justify-between items-center">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Last Analysis</span>
                                <span className="text-sm font-medium">{formatDate(activity.lastAIInsightTime)}</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* STEP 6: Security & Privacy */}
                <section className="glass-card p-6 border-destructive/20 bg-destructive/5 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-destructive" />
                        </div>
                        <h2 className="text-xl font-heading font-semibold text-destructive">Security & Control</h2>
                    </div>
                    <div className="bg-background/50 p-4 rounded-lg flex items-start gap-3 border border-destructive/10">
                        <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            This application never stores private keys or seed phrases. Your data is your own.
                            Disconnecting removes all local session references.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" size="sm" onClick={() => window.open('https://ethereum.org/en/security/', '_blank')}>
                            Security Tips <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={!isConnected}>
                            Disconnect Wallet
                        </Button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Profile;
