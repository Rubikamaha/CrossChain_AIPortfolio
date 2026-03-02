import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { PortfolioCards } from '@/components/PortfolioCards';
import { OpportunityFeed } from '@/components/OpportunityFeed';
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
import { useWallet } from '@/hooks/useWallet';
import { mockPortfolioData } from '@/data/mockData';

const Index = () => {
  const { isConnected, account, connect, disconnect } = useWallet();
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

  // Fetch wallet balances when connected
  const { portfolioData, isLoading, error, refresh } = useWalletBalances({
    address: account,
    networkMode,
    enabled: isConnected && !!account,
  });

  // USE MOCK DATA IF DISCONNECTED (Demo Mode)
  // We treat the app as "Connected" for the dashboard components to show the data
  const activeData = isConnected ? portfolioData : (mockPortfolioData as unknown as import('@/lib/walletService').PortfolioData);
  const showDemoMode = !isConnected;
  const dashboardConnectedState = true; // Always show dashboard content (Real or Mock)

  // Calculate and update health score when portfolio data is available
  useEffect(() => {
    if (activeData) {
      const updateScoreAndSync = async () => {
        const { calculateHealthScore } = await import('@/lib/walletService');
        const health = calculateHealthScore(activeData, riskPersonality);
        updateHealthScore(health.score, health.explanation);
        if (isConnected) updateSyncTime(); // Only sync time if real connection
      };
      updateScoreAndSync();
    }
  }, [activeData, updateHealthScore, updateSyncTime, riskPersonality, isConnected]);

  const handleAnalyze = async () => {
    if (!activeData) return;

    setIsAnalyzing(true);
    try {
      const result = await aiService.generatePortfolioAnalysis(activeData, {
        riskPersonality,
        learningMode,
        notifications,
        healthScore: activity.healthScore
      });
      setAnalysis(result);
      if (isConnected) updateAIInsightTime();
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
    connect();
    toast({
      title: 'Connecting...',
      description: 'Opening wallet selection modal.',
    });
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
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

          {/* Demo Mode Banner */}
          {!isConnected && (
            <div className="bg-primary/5 py-1 text-center border-b border-primary/10">
              <p className="text-xs text-primary font-medium">✨ Viewing Demo Portfolio. Connect wallet to see your live data.</p>
            </div>
          )}

          {isConnected && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              <OpportunityFeed />
            </div>
          )}

          <PortfolioCards
            portfolioData={activeData}
            isLoading={isLoading && isConnected}
            isConnected={dashboardConnectedState}
            analysis={analysis}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
          <PortfolioAnalytics
            portfolioData={activeData}
            isLoading={isLoading && isConnected}
          />
          <AIInsights
            portfolioData={activeData}
            isConnected={dashboardConnectedState}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />
          <AssetsTable
            portfolioData={activeData}
            isLoading={isLoading && isConnected}
            isConnected={dashboardConnectedState}
          />
          <AlertsPanel
            analysis={analysis}
            portfolioData={activeData}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
