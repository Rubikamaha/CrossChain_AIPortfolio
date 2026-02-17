import { portfolioStats } from '@/data/mockData';
import { DollarSign, Activity, TrendingUp, Loader2, Info, Shield, Target, GraduationCap, Coins, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PortfolioData } from '@/lib/walletService';
import { useNetworkMode } from '@/contexts/NetworkModeContext';
import { getAllChains } from '@/lib/chainConfig';
import type { AIAnalysis } from '@/lib/aiService';
import { useProfile } from '@/contexts/ProfileContext';

const USD_TO_INR = 84.5; // Estimated exchange rate

function formatCurrency(value: number, currency: 'USD' | 'INR' = 'USD'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value * USD_TO_INR);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatCrypto(value: string | number, symbol: string): string {
  const val = typeof value === 'string' ? parseFloat(value) : value;
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(val)} ${symbol}`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'risk';
  riskLevel?: 'low' | 'medium' | 'high';
  isLoading?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
  hint?: string;
}

function StatCard({ title, value, subtitle, icon, trend, variant = 'default', riskLevel, isLoading, onClick, isClickable, hint }: StatCardProps) {
  const riskColors = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-destructive',
  };

  if (isLoading) {
    return (
      <div className="glass-card-hover p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div
      className={`glass-card-hover p-6 group transition-all duration-200 relative ${isClickable ? 'cursor-pointer active:scale-95' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            <TrendingUp className={`w-4 h-4 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
        {title}
        {hint && <Info className="w-3 h-3 opacity-40 hover:opacity-100 cursor-help" />}
      </p>
      <p className={`text-2xl font-heading font-bold ${variant === 'risk' && riskLevel ? riskColors[riskLevel] : ''}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

interface NetworkCardProps {
  name: string;
  symbol: string;
  icon: string;
  balance: number;
  usdValue?: number;
  isConnected: boolean;
  type: 'mainnet' | 'testnet';
  currency: 'USD' | 'INR';
  error?: string;
}

function NetworkCard({ name, symbol, icon, balance, usdValue, isConnected, type, currency, error }: NetworkCardProps) {
  const displayUsdValue = usdValue || 0;

  return (
    <div className={`glass-card p-4 flex flex-col gap-3 relative overflow-hidden ${error ? 'border-destructive/30 shadow-none' : 'glass-card-hover'}`}>
      <div className="flex items-center gap-3 mt-1">
        <div className="text-3xl">{icon}</div>
        <div>
          <h4 className="font-heading font-semibold text-base">{name}</h4>
          <span className="text-xs text-muted-foreground">{symbol}</span>
        </div>
        {type === 'testnet' && <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Test</span>}
      </div>

      <div className="mt-2 border-t border-border/50 pt-3">
        {isConnected ? (
          <div className="flex flex-col gap-1">
            {error ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Sync Issue
                </span>
                <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight" title={error}>
                  {error.includes('403') ? 'Network Disabled' : error.includes('503') ? 'Quota Reached' : 'Service Down'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className="font-bold text-sm tracking-tight">{formatCrypto(balance, symbol)}</span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Value</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(displayUsdValue, currency)}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 opacity-70">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="font-bold text-sm tracking-tight">- {symbol}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Value</span>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">-</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface PortfolioCardsProps {
  portfolioData?: PortfolioData | null;
  isLoading?: boolean;
  isConnected?: boolean;
  analysis?: AIAnalysis | null;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export function PortfolioCards({ portfolioData, isLoading, isConnected, analysis, onAnalyze, isAnalyzing }: PortfolioCardsProps) {
  const { preferredCurrency, riskPersonality, learningMode } = useProfile();
  const allChains = getAllChains();

  const mainnetChains = allChains.filter(c => c.type === 'mainnet');
  const testnetChains = allChains.filter(c => c.type === 'testnet');

  const showRealData = isConnected && portfolioData;
  const nativeValue = showRealData ? portfolioData.totalValue : 0;
  const tokenValue = showRealData ? (portfolioData.totalTokenValue || 0) : 0;
  const nftValue = showRealData ? (portfolioData.totalNftValue || 0) : 0;
  const nftCount = showRealData ? (portfolioData.totalNftCount || 0) : 0;

  const totalNetWorth = nativeValue + tokenValue + nftValue;

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'low';
    if (score >= 50) return 'medium';
    return 'high';
  };

  const riskLevel = (analysis && analysis.healthScore) ? getRiskLevel(analysis.healthScore) : 'medium';

  const beginnerHints = {
    value: "This shows the total market value of your assets converted to your preferred currency.",
    risk: "Your health score represents how safe your portfolio is based on diversification and network risk.",
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold">Portfolio Overview</h2>
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Target className="w-3 h-3" />
                {riskPersonality} Profile
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold uppercase tracking-wider text-accent">
                <GraduationCap className="w-3 h-3" />
                {learningMode} Mode
              </div>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Net Worth"
            value={isConnected ? formatCurrency(totalNetWorth, preferredCurrency) : 'Connect Wallet'}
            icon={<DollarSign className="w-6 h-6 text-primary" />}
            trend={showRealData ? { value: portfolioStats.change24h, isPositive: portfolioStats.change24h > 0 } : undefined}
            isLoading={isLoading}
            hint={learningMode === 'Beginner' ? beginnerHints.value : undefined}
          />

          <StatCard
            title="DeFi & Tokens"
            value={isConnected ? formatCurrency(tokenValue, preferredCurrency) : '-'}
            subtitle={isConnected ? "ERC20 Holdings" : undefined}
            icon={<Coins className="w-6 h-6 text-blue-500" />}
            isLoading={isLoading}
          />

          <StatCard
            title="NFT Collection"
            value={isConnected ? nftCount.toString() : '-'}
            subtitle={isConnected ? (nftValue > 0 ? `Est. ${formatCurrency(nftValue, preferredCurrency)}` : "Collectibles") : undefined}
            icon={<ImageIcon className="w-6 h-6 text-purple-500" />}
            isLoading={isLoading}
          />

          <div onClick={(!analysis && !isAnalyzing && onAnalyze) ? onAnalyze : undefined}>
            <StatCard
              title="AI Health Score"
              value={isConnected ? (isAnalyzing ? 'Analyzing...' : (analysis ? analysis.healthScore : 'Calculate')) : '-'}
              subtitle={isConnected ? (analysis ? `${analysis.riskLevel} Risk Analysis Complete` : "Click to trigger AI audit") : "Connect to analyze"}
              icon={isAnalyzing ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Shield className="w-6 h-6 text-primary" />}
              variant="risk"
              riskLevel={riskLevel}
              isLoading={isLoading}
              isClickable={isConnected && !analysis && !isAnalyzing}
              hint={learningMode === 'Beginner' ? beginnerHints.risk : undefined}
            />
          </div>
        </div>

        {/* Mainnet Networks */}
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80">
            <Activity className="w-5 h-5 text-primary" />
            Mainnet Networks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mainnetChains.map((chain) => {
              const chainBalance = portfolioData?.balances.find(b => b.chainId === chain.chainId);
              const balance = chainBalance ? chainBalance.balanceFormatted : 0;
              const usdValue = chainBalance ? chainBalance.usdValue : 0;

              return (
                <NetworkCard
                  key={chain.chainId}
                  name={chain.name}
                  symbol={chain.symbol}
                  icon={chain.icon}
                  type={chain.type}
                  balance={balance}
                  usdValue={usdValue}
                  currency={preferredCurrency}
                  isConnected={!!isConnected}
                  error={chainBalance?.error}
                />
              );
            })}
          </div>
        </div>

        {/* Testnet Networks */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/60">
            <Activity className="w-5 h-5 text-muted-foreground" />
            Testnet Networks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {testnetChains.map((chain) => {
              const chainBalance = portfolioData?.balances.find(b => b.chainId === chain.chainId);
              const balance = chainBalance ? chainBalance.balanceFormatted : 0;
              const usdValue = chainBalance ? chainBalance.usdValue : 0;

              return (
                <NetworkCard
                  key={chain.chainId}
                  name={chain.name}
                  symbol={chain.symbol}
                  icon={chain.icon}
                  type={chain.type}
                  balance={balance}
                  usdValue={usdValue}
                  currency={preferredCurrency}
                  isConnected={!!isConnected}
                  error={chainBalance?.error}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

