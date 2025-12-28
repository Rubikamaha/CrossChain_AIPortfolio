import { Button } from '@/components/ui/button';
import { aiInsight } from '@/data/mockData';
import { Brain, TrendingUp, Sparkles, ArrowRight, Target } from 'lucide-react';

export function AIInsights() {
  const recommendationColors = {
    Buy: 'text-success bg-success/10',
    Sell: 'text-destructive bg-destructive/10',
    Hold: 'text-warning bg-warning/10',
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            AI Insights
          </h2>
          <Button variant="ghost" size="sm" className="text-primary">
            View Full Analysis
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Recommendation Card */}
          <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-accent/10 to-transparent opacity-50" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Overall Recommendation</p>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${recommendationColors[aiInsight.recommendation]}`}>
                    {aiInsight.recommendation}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">AI Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${aiInsight.confidence}%` }}
                      />
                    </div>
                    <span className="font-semibold text-primary">{aiInsight.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                {aiInsight.summary}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button variant="gradient" size="sm">
                  <Sparkles className="w-4 h-4" />
                  Apply AI Strategy
                </Button>
                <Button variant="glass" size="sm">
                  Customize Parameters
                </Button>
              </div>
            </div>
          </div>

          {/* Top Pick Card */}
          <div className="glass-card p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent" />
              <p className="text-sm font-medium text-muted-foreground">AI Top Pick</p>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                  ◎
                </div>
                <div>
                  <p className="font-heading text-xl font-bold">{aiInsight.topPick.asset}</p>
                  <span className="text-sm text-success font-medium">{aiInsight.topPick.action}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiInsight.topPick.reason}
              </p>
            </div>

            <Button variant="outline" size="sm" className="mt-4 w-full">
              <TrendingUp className="w-4 h-4" />
              View Details
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
