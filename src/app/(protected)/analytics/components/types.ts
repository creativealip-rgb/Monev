// Shared types for analytics components

export interface CategoryBreakdown {
    name: string;
    amount: number;
    color: string;
    icon: string;
}

export interface Budget {
    id: number;
    amount: number;
    spent: number;
    category: {
        id: number;
        name: string;
        color: string;
        icon: string;
    };
}

export interface DailyStat {
    date: string;
    count: number;
    total: number;
}

export interface AnalyticsData {
    income: number;
    expense: number;
    balance: number;
    allocations: {
        name: string;
        amount: number;
        percentage: number;
        target: number;
        color: string;
    }[];
    categoryBreakdown: {
        expense: CategoryBreakdown[];
        income: CategoryBreakdown[];
    };
    healthScore: any;
    cashflowPrediction: {
        nextMonth: number;
        trend: "up" | "down" | "stable";
        confidence: number;
    };
    budgets: Budget[];
    goalsProgress: any[];
    budgetAlerts: any[];
    financialHealth: any;
    dailyStats: DailyStat[];
    totalInvestments: number;
    insights: string | null;
    canAccessAIInsights: boolean;
    hideBalance: boolean;
    monthlyComparison?: Array<{
        month: string;
        income: number;
        expense: number;
    }>;
    spendingPatterns?: {
        averageDailySpending: number;
        highestSpendingDay: string;
        anomalies: any[];
    };
}
