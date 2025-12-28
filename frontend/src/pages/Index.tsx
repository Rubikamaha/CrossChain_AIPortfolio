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
import { openConnectModal, disconnect as walletDisconnect } from '@/lib/walletConnect';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = () => {
    // Open the Reown connect modal
    openConnectModal()
    // keep the simulated UI toast; actual connected state will require wallet events
    // optimistic UI
    setIsConnected(true)
    toast({
      title: 'Wallet Modal Opened',
      description: 'Please choose a wallet to connect.',
    })
  };

  const handleDisconnect = async () => {
    // Optimistically update UI so the Connect button appears immediately
    setIsConnected(false)
    setAccount(null)
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected from this site.',
    })

    // Perform actual disconnect in background; show an error toast if it fails
    try {
      await walletDisconnect()
    } catch (err) {
      toast({
        title: 'Disconnect failed',
        description: 'There was an issue fully disconnecting the wallet.',
      })
    }
  }

  // Listen for adapter-driven disconnect events
  useEffect(() => {
    const onDisconnected = () => setIsConnected(false)
    window.addEventListener('wallet:disconnected', onDisconnected)
    return () => window.removeEventListener('wallet:disconnected', onDisconnected)
  }, [])

  // Read initial accounts from injected provider and listen for account changes
  useEffect(() => {
    const updateAccounts = (accounts: any) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAccount(accounts[0])
        setIsConnected(true)
      } else {
        setAccount(null)
        setIsConnected(false)
      }
    }

    // Try to get accounts via ethereum provider
    const tryInit = async () => {
      try {
        // @ts-ignore
        const provider = (window as any).ethereum
        if (provider && provider.request) {
          const accounts = await provider.request({ method: 'eth_accounts' })
          updateAccounts(accounts)

          // subscribe to account changes
          provider.on('accountsChanged', updateAccounts)
        }
      } catch (e) {
        // ignore
      }
    }

    tryInit()

    // fallback: listen for custom connect events
    const onConnectEvent = (e: any) => {
      const maybeAccounts = e?.detail?.accounts || null
      if (maybeAccounts) updateAccounts(maybeAccounts)
    }
    window.addEventListener('wallet:connected', onConnectEvent as EventListener)

    return () => {
      // cleanup provider listener if present
      try {
        // @ts-ignore
        const provider = (window as any).ethereum
        if (provider && provider.removeListener) provider.removeListener('accountsChanged', updateAccounts)
      } catch {}
      window.removeEventListener('wallet:connected', onConnectEvent as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar isConnected={isConnected} account={account} onConnect={handleConnect} onDisconnect={handleDisconnect} />
      
      <main>
        <Hero onConnect={handleConnect} />
        
        {/* Dashboard sections - visible when scrolled or after hero */}
        <div className="relative">
          {/* Subtle section divider */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <PortfolioCards />
          <PortfolioAnalytics />
          <AIInsights />
          <AssetsTable />
          <AlertsPanel />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
