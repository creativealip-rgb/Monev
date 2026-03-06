import type {
    Transaction,
    User,
    Category,
    Budget,
    Goal,
    Bill,
    Investment,
    Debt,
    MerchantMapping,
    UserSettings,
    ScheduledMessage,
    ChatHistory,
    Coupon,
    CouponClaim,
    AdminActivityLog,
    AiInsightsCache,
    RecurringTransaction,
    Streak,
    Achievement,
    InsertTransaction,
    InsertCategory,
    InsertBudget,
    InsertGoal,
    InsertBill,
    InsertInvestment,
    InsertDebt,
} from "@/backend/db/schema";

export type {
    Transaction,
    User,
    Category,
    Budget,
    Goal,
    Bill,
    Investment,
    Debt,
    MerchantMapping,
    UserSettings,
    ScheduledMessage,
    ChatHistory,
    Coupon,
    CouponClaim,
    AdminActivityLog,
    AiInsightsCache,
    RecurringTransaction,
    Streak,
    Achievement,
    InsertTransaction,
    InsertCategory,
    InsertBudget,
    InsertGoal,
    InsertBill,
    InsertInvestment,
    InsertDebt,
};

// Frontend-specific types that extend or combine schema types
export type InvestmentSummary = {
    totalValue: number;
    totalCost: number;
    totalProfit: number;
    totalDividends: number;
    profitPercent: number;
    allocation: { label: string; value: number; color: string }[];
    items: Investment[];
};

export type BudgetSummary = {
    id: number;
    category: string;
    categoryId: number;
    limit: number;
    spent: number;
    color: string;
    percentage: number;
};

export type TransactionWithCategory = Transaction & {
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
};

export type BudgetWithProgress = Budget & {
    percentage: number;
    daysRemaining: number;
    dailyBudget: number;
};

export type GoalWithProgress = Goal & {
    percentage: number;
    daysUntilDeadline?: number;
    monthlyTarget?: number;
};
