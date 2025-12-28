import { Button } from '@/components/ui/button';
import { Wallet, Play, Sparkles, Shield, Layers } from 'lucide-react';

interface HeroProps {
  onConnect: () => void;
}

export function Hero({ onConnect }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Powered by Advanced AI</span>
        </div>

        {/* Heading */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Unified Cross-Chain
          <br />
          <span className="gradient-text">AI Portfolio</span> Dashboard
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Track, analyze, and optimize your crypto assets across multiple blockchains 
          using cutting-edge AI technology
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button variant="hero" size="xl" onClick={onConnect} className="w-full sm:w-auto">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </Button>
          <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
            <Play className="w-5 h-5" />
            View Demo
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Multi-Chain</p>
              <p className="text-xs text-muted-foreground">5+ Networks</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">AI-Powered</p>
              <p className="text-xs text-muted-foreground">Smart Insights</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Secure</p>
              <p className="text-xs text-muted-foreground">Non-Custodial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
