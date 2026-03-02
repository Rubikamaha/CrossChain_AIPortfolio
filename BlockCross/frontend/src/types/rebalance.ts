export interface RebalanceAction {
    id: number;
    action: 'Buy' | 'Sell';
    asset: string;
    amount: number;
    valueUsd: number;
    reason: string;
}

export interface RebalanceAnalysis {
    healthScore: number;
    riskScore: number;
    currentAllocation: { [key: string]: number };
    targetAllocation: { [key: string]: number };
    driftDetected: boolean;
    actions: RebalanceAction[];
    explanation: string;
}
