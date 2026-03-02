import { Zap, Github, Twitter, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">
                Cross-Chain <span className="gradient-text">AI</span> Portfolio
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              The most advanced cross-chain portfolio management platform powered by 
              artificial intelligence. Track, analyze, and optimize your crypto assets 
              across multiple blockchains.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <Twitter className="w-5 h-5 text-muted-foreground" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <Github className="w-5 h-5 text-muted-foreground" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Tech Stack</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>React + TypeScript</li>
              <li>Tailwind CSS</li>
              <li>Web3.js / Ethers.js</li>
              <li>AI/ML Models</li>
              <li>Multi-Chain APIs</li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Cross-Chain AI Portfolio. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
