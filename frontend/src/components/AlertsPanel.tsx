import { Bell, TrendingUp, AlertTriangle, Brain, CheckCircle, X, Wallet, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AIAnalysis } from '@/lib/aiService';
import { PortfolioData, calculateHealthScore } from '@/lib/walletService';
import { useProfile } from '@/contexts/ProfileContext';

interface AlertsPanelProps {
  analysis?: AIAnalysis | null;
  portfolioData?: PortfolioData | null;
}

export function AlertsPanel({ analysis, portfolioData }: AlertsPanelProps) {
  const { notifications, riskPersonality } = useProfile();

  // Generate alerts dynamically
  const alerts: any[] = [];

  // Calculate health locally to get the imbalance flag
  const healthResult = portfolioData ? calculateHealthScore(portfolioData, riskPersonality) : null;

  // 1. Portfolio Imbalance Alerts (Only if toggled ON)
  if (notifications.imbalanceAlert && healthResult?.imbalanceDetected) {
    alerts.push({
      type: 'imbalance',
      severity: riskPersonality === 'Conservative' ? 'error' : 'warning',
      message: `Portfolio Imbalance: Your current asset distribution doesn't match your ${riskPersonality} risk profile.`,
      time: 'Live'
    });
  }

  // 2. High-Risk Asset Alerts (Only if toggled ON)
  if (notifications.highRiskAlert && portfolioData?.balances) {
    portfolioData.balances.forEach(b => {
      // Simple heuristic: very low USD value but non-zero balance might be a "dust" or high risk small cap if it's not a major token
      // For this demo, let's say any balance on a non-Ethereum chain for a Conservative user is "Higher Risk"
      if (riskPersonality === 'Conservative' && b.chainId !== 1 && b.balanceFormatted > 0) {
        alerts.push({
          type: 'volatility',
          severity: 'warning',
          message: `Risk Awareness: Holding assets on ${b.chainName} is outside your primary network preference.`,
          time: 'Live'
        });
      }
    });
  }

  // 3. AI Analysis Alerts
  if (analysis) {
    if (analysis.healthScore < 50) {
      alerts.push({
        type: 'ai',
        severity: 'error',
        message: `Critical Risk Detected: Portfolio Health Score is low (${analysis.healthScore}/100). Consider rebalancing immediately.`,
        time: 'Just now'
      });
    } else if (analysis.healthScore < 80) {
      alerts.push({
        type: 'ai',
        severity: 'warning',
        message: `Moderate Risk: Portfolio Health Score is ${analysis.healthScore}/100. Review suggestions.`,
        time: 'Just now'
      });
    }

    analysis.recommendations?.forEach(rec => {
      alerts.push({
        type: 'ai',
        severity: rec.type === 'Sell' ? 'warning' : 'success',
        message: `AI Recommendation: ${rec.type} ${rec.asset} - ${rec.reason}`,
        time: 'Just now'
      });
    });
  }

  // 4. Portfolio/Wallet Alerts
  if (portfolioData?.balances) {
    const lowBalanceThreshold = 0.01; // e.g., 0.01 ETH

    portfolioData.balances.forEach(b => {
      if (b.balanceFormatted < lowBalanceThreshold && b.balanceFormatted > 0) {
        alerts.push({
          type: 'wallet',
          severity: 'warning',
          message: `Low Balance on ${b.chainName}: ${b.balanceFormatted.toFixed(4)} ${b.symbol}. You may not have enough for gas fees.`,
          time: 'Live'
        });
      }
    });
  }

  // Fallback if no alerts
  if (alerts.length === 0) {
    alerts.push({
      type: 'system',
      severity: 'success',
      message: 'All systems operational. No critical alerts.',
      time: 'Now'
    });
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price': return <TrendingUp className="w-4 h-4" />;
      case 'volatility': return <AlertTriangle className="w-4 h-4" />;
      case 'imbalance': return <ShieldAlert className="w-4 h-4" />;
      case 'ai': return <Brain className="w-4 h-4" />;
      case 'wallet': return <Wallet className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-success/10 text-success border-success/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Alerts & Notifications
          </h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Clear all
          </Button>
        </div>

        <div className="glass-card divide-y divide-border">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 hover:bg-secondary/20 transition-colors group"
            >
              <div className={`p-2 rounded-lg border ${getSeverityStyles(alert.severity)}`}>
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                  {alert.type === 'ai' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded">AI Insight</span>}
                  {alert.type === 'imbalance' && <span className="text-[10px] bg-warning/20 text-warning px-1.5 rounded">Strategy Mismatch</span>}
                </div>
              </div>

              <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
