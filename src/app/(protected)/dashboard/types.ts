"use client";

import type { LucideIcon } from "lucide-react";
import type { AIInsight } from "@/frontend/hooks/useAIInsight";

export interface DashboardStats {
    income: number;
    expense: number;
    balance: number;
    growth?: number;
    incomeGrowth?: number;
    expenseGrowth?: number;
    prevIncome?: number;
    prevExpense?: number;
    totalGoals?: number;
    totalInvestments?: number;
    fees?: number;
    healthScore?: any;
    streak?: { current: number; longest: number };
    weeklyBudgetRemaining?: number;
    weeklyBudgetTotal?: number;
    monthlyIncome?: number;
    totalAccounts?: number;
    accountCount?: number;
}

export interface Transaction {
    id: string;
    amount: number;
    description: string;
    categoryId?: number;
    categoryName: string;
    categoryColor?: string;
    categoryIcon?: string;
    type: "expense" | "income";
    createdAt: string;
    date?: Date;
    isVerified: boolean;
    paymentMethod?: string;
    accountId?: number | null;
}

export interface UserProfile {
    name: string;
    firstName?: string;
    lastName?: string;
    image: string | null;
    tier: "starter" | "pro" | "sultan" | "benefactor";
}

export interface DashboardData {
    transactions: Transaction[];
    allTransactions: Transaction[];
    stats: DashboardStats;
    userName: string;
    userTier: "starter" | "pro" | "sultan" | "benefactor";
    userImage: string | null;
    bills: any[];
    loading: boolean;
    mounted: boolean;
    refresh: () => Promise<void>;
}

export interface TodayStats {
    income: number;
    expense: number;
    count: number;
}

export interface FeatureConfig {
    label: string;
    icon: React.ReactNode;
    color: string;
    href: string;
}

export interface TierStyle {
    label: string;
    color: string;
    bg: string;
    icon: LucideIcon;
    border: string;
}

export type FilterPeriod = "today" | "week" | "month" | "all";

export interface AIInsightWidgetProps {
    insight: string;
    type: "success" | "warning" | "info";
    generatedAt?: string;
    onRefresh: () => void;
}

export interface HeroBalanceWidgetProps {
    stats: DashboardStats;
    mounted: boolean;
    onBalanceClick: () => void;
    onTransferClick: () => void;
    hideBalance: boolean;
    onToggleHideBalance: () => void;
}

export interface QuickStatsWidgetProps {
    todayIncome: number;
    todayExpense: number;
    todayTransactionCount: number;
    weeklyBudgetRemaining: number;
    weeklyBudgetTotal: number;
    currentStreak: number;
    longestStreak: number;
    mounted: boolean;
    isStealthMode: boolean;
}

export interface RecentTransactionsWidgetProps {
    transactions: Transaction[];
    loading: boolean;
    mounted: boolean;
    isStealthMode: boolean;
    onAddNew: () => void;
}

export interface FeaturesWidgetProps {
    userTier: "starter" | "pro" | "sultan" | "benefactor";
}

export interface DashboardHeaderProps {
    userName: string;
    userImage: string | null;
    userTier: "starter" | "pro" | "sultan" | "benefactor";
    streak: { current: number; longest: number } | undefined;
    formattedDate: string;
    mounted: boolean;
    onNotificationsClick?: () => void;
}
