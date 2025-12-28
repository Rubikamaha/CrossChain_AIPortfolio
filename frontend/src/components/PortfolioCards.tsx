import { portfolioStats } from '@/data/mockData';
import { DollarSign, Link, Coins, Activity, TrendingUp } from 'lucide-react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
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
}

function StatCard({ title, value, subtitle, icon, trend, variant = 'default', riskLevel }: StatCardProps) {
  const riskColors = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-destructive',
  };

  return (
    <div className="glass-card-hover p-6 group">
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
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className={`text-2xl font-heading font-bold ${variant === 'risk' && riskLevel ? riskColors[riskLevel] : ''}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function PortfolioCards() {
  const riskLevel = portfolioStats.riskScore.toLowerCase() as 'low' | 'medium' | 'high';

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Portfolio Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Portfolio Value"
            value={formatCurrency(portfolioStats.totalValue)}
            icon={<DollarSign className="w-6 h-6 text-primary" />}
            trend={{ value: portfolioStats.change24h, isPositive: portfolioStats.change24h > 0 }}
          />
          <StatCard
            title="Connected Chains"
            value={portfolioStats.connectedChains}
            subtitle="Networks active"
            icon={<Link className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Total Assets"
            value={portfolioStats.totalAssets}
            subtitle="Tokens & coins"
            icon={<Coins className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="AI Risk Score"
            value={portfolioStats.riskScore}
            subtitle={`${portfolioStats.riskValue}/100`}
            icon={<Activity className="w-6 h-6 text-primary" />}
            variant="risk"
            riskLevel={riskLevel}
          />
        </div>
      </div>
    </section>
  );
}
