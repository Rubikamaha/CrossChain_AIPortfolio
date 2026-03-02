import { useState } from 'react';
import { assets, chainDistribution } from '@/data/mockData';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChainBadge } from '@/components/ChainBadge';
import type { PortfolioData } from '@/lib/walletService';
import { useNetworkMode } from '@/contexts/NetworkModeContext';
import { getChainsByMode, getChainColor } from '@/lib/chainConfig';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

interface AssetsTableProps {
  portfolioData?: PortfolioData;
  isLoading?: boolean;
  isConnected?: boolean;
}

export function AssetsTable({ portfolioData, isLoading, isConnected }: AssetsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<number | 'all'>('all');
  const { networkMode } = useNetworkMode();

  // Get available chains based on network mode
  const availableChains = getChainsByMode(networkMode);

  // Use real balances if available, otherwise show demo data
  const balances = portfolioData?.balances || [];

  // Get unique chains that have balances
  const chainsWithBalances = isConnected && balances.length > 0
    ? Array.from(new Set(balances.map(b => b.chainId)))
    : availableChains.map(c => c.chainId);

  const filteredBalances = balances.filter(balance => {
    const matchesSearch = balance.chainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      balance.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChain = selectedChain === 'all' || balance.chainId === selectedChain;
    return matchesSearch && matchesChain;
  });

  // Fallback to demo data if not connected
  const displayAssets = isConnected && balances.length > 0 ? filteredBalances : assets.filter(asset => {
    const matchesSearch = asset.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.chain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Cross-Chain Assets</h2>

        {!isConnected && !isLoading && (
          <div className="glass-card p-8 text-center mb-6">
            <p className="text-muted-foreground mb-2">
              Connect your wallet to view your assets across all chains
            </p>
            <p className="text-sm text-muted-foreground/70">
              Real-time balances will be displayed for each connected network
            </p>
          </div>
        )}

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
            <Button
              variant={selectedChain === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChain('all')}
              className="whitespace-nowrap"
            >
              All Chains
            </Button>
            {availableChains.map((chain) => (
              <Button
                key={chain.chainId}
                variant={selectedChain === chain.chainId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChain(chain.chainId)}
                className="whitespace-nowrap"
              >
                {chain.icon} {chain.name}
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
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isConnected && balances.length > 0 ? (
                  filteredBalances.map((balance) => (
                    <tr
                      key={`${balance.chainId}-${balance.symbol}`}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ChainBadge chainId={balance.chainId} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{balance.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm">{balance.balanceFormatted.toFixed(6)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-medium">{formatCurrency(balance.usdValue || 0)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          ✓ Connected
                        </span>
                      </td>
                    </tr>
                  ))
                ) : !isConnected ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Connect your wallet to view your assets
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No assets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

