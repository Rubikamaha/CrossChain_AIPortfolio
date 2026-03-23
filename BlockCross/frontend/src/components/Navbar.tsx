import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { navItems } from '@/data/mockData';
import { Wallet, User, Menu, X, Zap, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  isConnected: boolean;
  account?: string | null;
  onConnect: () => void;
  onDisconnect?: () => void;
  mode?: 'DEMO' | 'LIVE';
}

export function Navbar({ isConnected, account, onConnect, onDisconnect, mode = 'DEMO' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:block">
              Cross-Chain <span className="gradient-text">AI</span> Portfolio
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === item.href
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mode Indicator */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${mode === 'DEMO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
              }`}>
              {mode === 'DEMO' ? 'Demo Mode' : 'Live Mode'}
            </div>

            {/* Wallet Status */}
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Live' : 'Connect'}
              </span>
            </div>

            {/* Connect/User Button */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Link to="/settings">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="glass" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={onDisconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button variant="hero" size="sm" onClick={onConnect} className="gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect</span>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === item.href
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
