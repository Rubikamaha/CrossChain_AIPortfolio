import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { chainDistribution, portfolioGrowth } from '@/data/mockData';

function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{formatValue(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function PortfolioAnalytics() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold mb-6">Portfolio Analytics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Chain Distribution</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chainDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chainDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {chainDistribution.map((chain) => (
                  <div key={chain.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: chain.color }}
                    />
                    <span className="text-sm text-muted-foreground">{chain.name}</span>
                    <span className="text-sm font-medium ml-auto">{chain.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Growth Line Chart */}
          <div className="glass-card p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Portfolio Growth</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioGrowth}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
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
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
