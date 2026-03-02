import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { TrendData } from '@/lib/insightHistoryService';

interface TrendChartsProps {
    trendData: TrendData;
    isLoading?: boolean;
}

export function TrendCharts({ trendData, isLoading }: TrendChartsProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2].map((i) => (
                    <Card key={i} className="glass-card">
                        <CardHeader>
                            <div className="h-6 w-48 bg-secondary/50 rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-secondary/30 rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (trendData.dataPoints === 0) {
        return (
            <Card className="glass-card">
                <CardContent className="py-12 text-center">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Historical Data Yet</h3>
                    <p className="text-muted-foreground">
                        Generate more insights to see trends over time
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Prepare data for charts
    const chartData = trendData.timestamps.map((timestamp, index) => ({
        date: new Date(timestamp),
        dateFormatted: format(new Date(timestamp), 'MMM dd'),
        healthScore: trendData.healthScoreTrend[index],
        portfolioValue: trendData.valueTrend[index],
        riskLevel: trendData.riskTrend[index]
    }));

    // Calculate changes
    const latestHealthScore = trendData.healthScoreTrend[trendData.healthScoreTrend.length - 1];
    const firstHealthScore = trendData.healthScoreTrend[0];
    const healthScoreChange = latestHealthScore - firstHealthScore;

    const latestValue = trendData.valueTrend[trendData.valueTrend.length - 1];
    const firstValue = trendData.valueTrend[0];
    const valueChange = ((latestValue - firstValue) / firstValue) * 100;

    return (
        <div className="space-y-6">
            {/* Health Score Trend */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-accent" />
                            Portfolio Health Score Trend
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {healthScoreChange >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-success" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-destructive" />
                            )}
                            <span className={`text-sm font-medium ${healthScoreChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {healthScoreChange >= 0 ? '+' : ''}{healthScoreChange.toFixed(1)} points
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis
                                dataKey="dateFormatted"
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="healthScore"
                                stroke="hsl(var(--success))"
                                strokeWidth={2}
                                fill="url(#healthGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Portfolio Value Trend */}
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Portfolio Value Over Time
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {valueChange >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-success" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-destructive" />
                            )}
                            <span className={`text-sm font-medium ${valueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {valueChange >= 0 ? '+' : ''}{valueChange.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis
                                dataKey="dateFormatted"
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) => `$${value.toFixed(0)}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                            />
                            <Line
                                type="monotone"
                                dataKey="portfolioValue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Data Points</div>
                        <div className="text-2xl font-bold">{trendData.dataPoints}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Current Health Score</div>
                        <div className="text-2xl font-bold text-success">{latestHealthScore}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                        <div className="text-2xl font-bold text-primary">${latestValue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
