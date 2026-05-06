// Shared types for analytics components

export interface CategoryBreakdown {
    categoryId?: number;
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

export interface SpendingPatternDay {
    date: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    totalAmount: number;
    transactionCount: number;
    severity?: "low" | "medium" | "high";
    ratioToAverage?: number;
    insight?: string;
}

export interface MonthlyStat {
    month: number;
    year?: number;
    monthName?: string;
    income: number;
    expense: number;
}

export interface GoalProgress {
    currentAmount: number;
    progress: number;
}

export interface BudgetAlert {
    category: string;
    spent: number;
    limit: number;
    percentage: number;
    isOver: boolean;
}

export interface HealthScoreData {
    score: number;
    label: string;
    emoji: string;
    color: string;
    tip?: string;
}

export interface AnalyticsSummary {
    avgDailySpending: number;
    savingsRate: number;
    highestSpendingDay: SpendingPatternDay | null;
    anomaliesCount: number;
    goalsCount: number;
    completedGoals: number;
    streakDays: number;
}

export interface ChartCategoryStat {
    categoryId: number;
    categoryName: string;
    total: number;
}

export interface IncomeStat {
    categoryId?: number;
    name: string;
    total: number;
}

export interface RecommendationData {
    expense: number;
    income: number;
    topCategory?: ChartCategoryStat;
}

export interface AnalyticsDrilldownFilter {
    title: string;
    description?: string;
    categoryId?: number;
    accountId?: number;
    type?: "expense" | "income" | "transfer" | "all";
    startDate?: string;
    endDate?: string;
}

export interface AnalyticsData {
    income: number;
    expense: number;
    balance: number;
    prevIncome?: number;
    prevExpense?: number;
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
    categoryStats?: ChartCategoryStat[];
    incomeStats?: IncomeStat[];
    monthlyStats?: MonthlyStat[];
    healthScore: HealthScoreData;
    cashflowPrediction: {
        nextMonth: number;
        trend: "up" | "down" | "stable";
        confidence: number;
    };
    budgets: Budget[];
    goalsProgress: GoalProgress[];
    budgetAlerts: BudgetAlert[];
    financialHealth: unknown;
    dailyStats: DailyStat[];
    totalAccounts?: number;
    accountCount?: number;
    totalInvestments: number;
    insights: string | null;
    canAccessAIInsights: boolean;
    hideBalance: boolean;
    monthlyComparison?: MonthlyStat[];
    spendingPatterns?: {
        averageDailySpending: number;
        highestSpendingDay: SpendingPatternDay | null;
        anomalies: SpendingPatternDay[];
    };
    summary?: AnalyticsSummary;
}
