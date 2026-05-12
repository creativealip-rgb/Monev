"use client";

import { QuickStatsSummary } from "@/frontend/components/QuickStatsSummary";
import type { QuickStatsWidgetProps } from "../../types";

export function QuickStatsWidget({
    todayIncome,
    todayExpense,
    todayTransactionCount,
    weeklyBudgetRemaining,
    weeklyBudgetTotal,
    currentStreak,
    longestStreak,
    mounted,
    isStealthMode,
    simpleMode,
}: QuickStatsWidgetProps) {
    return (
        <QuickStatsSummary
            todayIncome={todayIncome}
            todayExpense={todayExpense}
            todayTransactionCount={todayTransactionCount}
            weeklyBudgetRemaining={weeklyBudgetRemaining}
            weeklyBudgetTotal={weeklyBudgetTotal}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            mounted={mounted}
            isStealthMode={isStealthMode}
            simpleMode={simpleMode}
        />
    );
}
