import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { PortfolioCards } from '@/components/PortfolioCards';
import { PortfolioAnalytics } from '@/components/PortfolioAnalytics';
import { AIInsights } from '@/components/AIInsights';
import { AssetsTable } from '@/components/AssetsTable';
import { AlertsPanel } from '@/components/AlertsPanel';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useNetworkMode } from '@/contexts/NetworkModeContext';
import { openConnectModal, disconnect as walletDisconnect, modal } from '@/lib/walletConnect';
import { aiService, type AIAnalysis } from '@/lib/aiService';
import { useProfile } from '@/contexts/ProfileContext';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const { toast } = useToast();
  const { networkMode } = useNetworkMode();
  const {
    riskPersonality,
    learningMode,
    notifications,
    activity,
    updateAIInsightTime,
    updateHealthScore,
    updateSyncTime
  } = useProfile();

  // AI Analysis State
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Synchronize with AppKit Account State
  useEffect(() => {
    console.log('[Index] Initializing AppKit account subscription...');
    const unsubscribe = modal.subscribeAccount((state) => {
      console.log('[Index] AppKit account state change:', state);
      setIsConnected(state.isConnected);
      setAccount(state.address || null);
    });

    return () => {
      console.log('[Index] Cleaning up AppKit account subscription');
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, []);

  // Fetch wallet balances when connected
  const { portfolioData, isLoading, error, refresh } = useWalletBalances({
    address: account,
    networkMode,
    enabled: isConnected && !!account,
  });

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

  const handleAnalyze = async () => {
    if (!portfolioData) return;

    setIsAnalyzing(true);
    try {
      const result = await aiService.generatePortfolioAnalysis(portfolioData, {
        riskPersonality,
        learningMode,
        notifications,
        healthScore: activity.healthScore
      });
      setAnalysis(result);
      updateAIInsightTime();
    } catch (e) {
      console.error(e);
      toast({
        title: "Analysis Failed",
        description: "Could not generate portfolio insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConnect = () => {
    openConnectModal();
    toast({
      title: 'Connecting...',
      description: 'Opening wallet selection modal.',
    });
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
    setAccount(null);
    try {
      await walletDisconnect();
      toast({
        title: 'Disconnected',
        description: 'Wallet disconnected successfully.',
      });
    } catch (err) {
      console.error('Disconnect failed', err);
    }
  };

  // Show toast on balance fetch error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Sync Error',
        description: 'Failed to fetch some balances. Still showing what we could find.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Invisible Debug Trigger / Indicator */}
      <div className="fixed bottom-4 right-4 z-50 opacity-20 hover:opacity-100 transition-opacity bg-black/80 p-2 rounded text-[10px] text-white pointer-events-none">
        Connection: {isConnected ? '✅' : '❌'} | Auth: {account ? account.slice(0, 6) : 'None'} | Mode: {networkMode}
      </div>

      <Navbar isConnected={isConnected} account={account} onConnect={handleConnect} onDisconnect={handleDisconnect} />

      <main>
        <Hero onConnect={handleConnect} />

        {/* Dashboard sections */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <PortfolioCards
            portfolioData={portfolioData}
            isLoading={isLoading}
            isConnected={isConnected}
            analysis={analysis}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
          <PortfolioAnalytics
            portfolioData={portfolioData}
            isLoading={isLoading}
          />
          <AIInsights
            portfolioData={portfolioData}
            isConnected={isConnected}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />
          <AssetsTable
            portfolioData={portfolioData}
            isLoading={isLoading}
            isConnected={isConnected}
          />
          <AlertsPanel
            analysis={analysis}
            portfolioData={portfolioData}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
