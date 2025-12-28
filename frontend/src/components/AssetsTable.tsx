import { useState } from 'react';
import { assets, chainDistribution } from '@/data/mockData';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function AssetsTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('all');

  const chains = ['all', ...new Set(assets.map(a => a.chain))];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.chain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedChain === 'all' || asset.chain === selectedChain;
    return matchesSearch && matchesChain;
  });

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Cross-Chain Assets</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {chains.map((chain) => (
              <Button
                key={chain}
                variant={selectedChain === chain ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChain(chain)}
                className="whitespace-nowrap"
              >
                {chain === 'all' ? 'All Chains' : chain}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Chain</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Value (USD)</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">24h Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssets.map((asset, index) => (
                  <tr 
                    key={`${asset.chain}-${asset.asset}`}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ 
                            backgroundColor: chainDistribution.find(c => c.name === asset.chain)?.color || '#888' 
                          }}
                        />
                        <span className="text-sm text-muted-foreground">{asset.chain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{asset.icon}</span>
                        <span className="font-medium">{asset.asset}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm">{asset.balance.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-medium">{formatCurrency(asset.valueUsd)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        asset.change24h >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {asset.change24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(asset.change24h)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
