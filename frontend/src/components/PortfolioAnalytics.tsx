import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { type PortfolioData, type ChainBalance } from '@/lib/walletService';
import { getChainColor } from '@/lib/chainConfig';
import { useNetworkMode } from '@/contexts/NetworkModeContext';

interface PortfolioAnalyticsProps {
  portfolioData: PortfolioData | null;
  isLoading: boolean;
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Generate mock historical data based on current balances
const generateHistoricalData = (balances: (ChainBalance & { name: string, value: number, color: string, price?: number })[]) => {
  const days = 7;
  const data: { date: string, [key: string]: string | number }[] = [];
  const now = new Date();

  // Create 7 days of data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayPoint: { date: string, [key: string]: string | number } = { date: dateStr };

    // For each chain, generate a slightly varied value based on current balance
    balances.forEach((b) => {
      // Mock volatility: random swing between -5% and +5% per day relative to current value
      // This is just visual mock logic
      const volatility = 0.95 + Math.random() * 0.1;
      // We'll roughly say current balance is the result of today, past days were varied.
      // To make it look like a trend, we'll apply a cumulative factor or just random noise around the mean.
      // Simpler: Just random deviation from current value for past days.
      // Scaled by (days-i) to make it look like it converges to current value.
      const drift = (Math.random() - 0.5) * 0.02 * (i + 1); // drift gets larger further back

      // Re-calculate price (approx)
      const price = b.price || (b.balanceFormatted > 0 ? (b.usdValue ? b.usdValue / b.balanceFormatted : 0) : 0);
      // If no direct usdValue, use our internal mock dictionary or skip
      const finalValue = b.value; // Using the calculated value passed from component

      dayPoint[b.chainName] = Math.max(0, finalValue * (1 - drift));
    });

    data.push(dayPoint);
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any[], label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm border-border/50 bg-background/95 backdrop-blur-xl shadow-xl">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: { name: string, color: string, value: number }) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-mono font-medium">{formatValue(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function PortfolioAnalytics({ portfolioData, isLoading }: PortfolioAnalyticsProps) {
  const { selectedChainId } = useNetworkMode();

  // Filter balances based on selectedChainId
  const relevantBalances = useMemo(() => {
    return portfolioData?.balances.filter(b => {
      if (selectedChainId) return b.chainId === selectedChainId;
      return true;
    }) || [];
  }, [portfolioData, selectedChainId]);



  const { rawDistribution, totalVal, finalDistribution } = useMemo(() => {
    const rawDist = relevantBalances
      .map(b => {
        return {
          ...b,
          name: b.chainName,
          value: b.usdValue || 0, // Use real USD value from service
          color: getChainColor(b.chainId),
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalV = rawDist.reduce((acc, curr) => acc + curr.value, 0);

    // Group small items into "Other"
    const finalDist: { name: string, value: number, color: string, symbol: string, percentage: number }[] = [];
    let otherV = 0;
    const OTHER_THRESHOLD = 0.05; // 5%

    if (totalV > 0) {
      rawDist.forEach(item => {
        // If item is < 5% AND we already have 4 items, OR if we strictly want only top items separate
        // Let's stick to: Keep top 4 distinctive, group rest OR keep all > 5% distinctive.
        if (item.value / totalV < OTHER_THRESHOLD) {
          otherV += item.value;
        } else {
          finalDist.push({
            name: item.name,
            value: item.value,
            color: item.color,
            symbol: item.symbol,
            percentage: parseFloat(((item.value / totalV) * 100).toFixed(1))
          });
        }
      });

      if (otherV > 0) {
        finalDist.push({
          name: 'Other Networks',
          value: otherV,
          color: '#6c757d', // Grey for Others
          symbol: 'Various',
          percentage: parseFloat(((otherV / totalV) * 100).toFixed(1))
        });
      }
      // Ensure we sort so biggest is first (Other might be big or small)
      finalDist.sort((a, b) => b.value - a.value);
    }

    return { rawDistribution: rawDist, totalVal: totalV, finalDistribution: finalDist };
  }, [relevantBalances]);

  // 2. Prepare Growth Data (Stacked)
  // We use the full raw list for growth to show all layers (or maybe Top 5 to avoid clutter)
  const topChainsForGrowth = useMemo(() => rawDistribution.slice(0, 5), [rawDistribution]); // Take top 5 for stacks
  const growthData = useMemo(() => generateHistoricalData(topChainsForGrowth), [topChainsForGrowth]);

  // If no data, show empty state
  const showChart = finalDistribution.length > 0;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Portfolio Analytics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">
              {selectedChainId ? 'Chain Asset Distribution' : 'Cross-Chain Distribution'}
            </h3>

            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : !showChart ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No assets found {selectedChainId ? 'on this network' : ''}
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-48 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {finalDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${formatValue(value)} (${props.payload.percentage}%)`,
                          name
                        ]}
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-muted-foreground text-center line-clamp-2">
                      Total<br />{formatValue(totalVal)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 content-center">
                  {finalDistribution.map((chain) => (
                    <div key={chain.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: chain.color }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-foreground truncate">{chain.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground opacity-70">{chain.symbol}</span>
                          <span className="text-xs font-bold text-primary">{chain.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Growth Stacked Area Chart */}
          <div className="glass-card p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Network Growth (7d)</h3>
            <div className="h-48">
              {isLoading || !showChart ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No data available'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      {topChainsForGrowth.map((chain, i) => (
                        <linearGradient key={chain.chainId} id={`color-${chain.chainId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chain.color} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chain.color} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {topChainsForGrowth.map((chain) => (
                      <Area
                        key={chain.chainId}
                        type="monotone"
                        dataKey={chain.chainName}
                        stackId="1"
                        stroke={chain.color}
                        fill={`url(#color-${chain.chainId})`}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
