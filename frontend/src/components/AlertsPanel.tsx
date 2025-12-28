import { alerts } from '@/data/mockData';
import { Bell, TrendingUp, AlertTriangle, Brain, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AlertsPanel() {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price':
        return <TrendingUp className="w-4 h-4" />;
      case 'volatility':
        return <AlertTriangle className="w-4 h-4" />;
      case 'ai':
        return <Brain className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
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
            Mark all as read
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
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
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
