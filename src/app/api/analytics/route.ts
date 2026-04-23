import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, aiInsightsCache } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import {
    getAnalysisData,
    getFinancialHealthMetrics,
    getMonthlyComparison,
    getTopSpendingCategories,
    getSpendingPatterns,
    getGoalsProgress,
    getCashflowPrediction,
    getBudgets,
    getDailyTransactionStats,
    getTotalInvestmentsValue,
    getPassiveIncome,
    getUserSettings,
    getDebts,
    getUserStreak,
    type AnalyticsFilters
} from "@/backend/db/operations";
import { calculateHealthScore } from "@/lib/health-score";
import type {
    AnalyticsSummary,
    BudgetAlert,
    CategoryBreakdown,
    ChartCategoryStat,
    GoalProgress,
    MonthlyStat,
} from "@/app/(protected)/analytics/components/types";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

interface DebtItem {
    amount: number;
    description?: string | null;
}

interface BudgetForHealth {
    amount: number;
    spent: number;
}

interface TopCategoryResult {
    categoryId: number;
    categoryName: string;
    totalAmount: number;
}

interface CashflowProjection {
    projectedBalance: number;
}

interface CashflowResult {
    projections?: CashflowProjection[];
    trend: "positive" | "negative";
}

async function getCachedInsights(userId: number, month: number, year: number): Promise<string | null> {
    try {
        const db = getDb();
        const cached = await db.select()
            .from(aiInsightsCache)
            .where(and(
                eq(aiInsightsCache.userId, userId),
                eq(aiInsightsCache.month, month),
                eq(aiInsightsCache.year, year)
            ))
            .get();

        if (!cached) return null;

        const cacheAge = Date.now() - new Date(cached.updatedAt).getTime();
        if (cacheAge > CACHE_TTL_MS) {
            return null;
        }

        return cached.insights;
    } catch (error) {
        console.error("[getCachedInsights] Error:", error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const searchParams = req.nextUrl.searchParams;
        const now = new Date();
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const accountIdParam = searchParams.get("accountId");
        const categoryIdParam = searchParams.get("categoryId");

        let dateRange: { startDate: Date; endDate: Date } | undefined;
        if (startDateParam && endDateParam) {
            const startDate = new Date(`${startDateParam}T00:00:00.000Z`);
            const endDate = new Date(`${endDateParam}T23:59:59.999Z`);
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
            }
            if (startDate > endDate) {
                return NextResponse.json({ error: "Tanggal mulai harus lebih awal dari tanggal akhir" }, { status: 400 });
            }
            dateRange = { startDate, endDate };
        }

        const referenceDate = dateRange?.endDate || now;
        const month = parseInt(searchParams.get("month") || (referenceDate.getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || referenceDate.getFullYear().toString());
        const filters: AnalyticsFilters = {
            accountId: accountIdParam ? parseInt(accountIdParam, 10) : undefined,
            categoryId: categoryIdParam ? parseInt(categoryIdParam, 10) : undefined,
        };

        const db = getDb();
        const user = await db.select({
            tier: users.tier,
        })
            .from(users)
            .where(eq(users.id, userId))
            .get();

        const settings = await getUserSettings(userId);

        const userTier = user?.tier || "starter";
        const canAccessAIInsights = userTier === "pro" || userTier === "sultan";
        const hideBalance = settings?.hideBalance || false;

        const [
            basicAnalysis,
            health,
            monthlyComparison,
            topCategories,
            spendingPatterns,
            goalsProgress,
            cashflowPrediction,
            budgets,
            dailyStats,
            totalInvestments,
            passiveIncome,
            unpaidDebts,
            streak
        ] = await Promise.all([
            getAnalysisData(userId, year, month, dateRange, filters),
            getFinancialHealthMetrics(userId),
            getMonthlyComparison(userId, 6, filters),
            getTopSpendingCategories(userId, year, month, 5, dateRange, filters),
            getSpendingPatterns(userId, year, month, dateRange, filters),
            getGoalsProgress(userId),
            getCashflowPrediction(userId),
            getBudgets(userId, month, year),
            getDailyTransactionStats(userId, year, month, dateRange, filters),
            getTotalInvestmentsValue(userId),
            getPassiveIncome(userId, year, month, dateRange, filters),
            getDebts(userId, "unpaid"),
            getUserStreak(userId)
        ]);

        let insights: string | null = null;

        if (canAccessAIInsights) {
            insights = await getCachedInsights(userId, month, year);
        }

        let totalOwe = 0;
        let totalOwed = 0;
        (unpaidDebts as DebtItem[]).forEach((d) => {
            if (d.description?.startsWith("[OWED]")) {
                totalOwed += d.amount;
            } else {
                totalOwe += d.amount;
            }
        });

        const healthScore = calculateHealthScore({
            income: basicAnalysis.income,
            expense: basicAnalysis.expense,
            streakDays: streak?.currentStreak || 0,
            budgets: (budgets as BudgetForHealth[]).map((b) => ({ amount: b.amount, spent: b.spent })),
            goalsCount: goalsProgress.length,
            totalOwe,
            totalOwed
        });

        const avgDailySpending = spendingPatterns.averageDailySpending;
        const savingsRate = basicAnalysis.income > 0
            ? ((basicAnalysis.income - basicAnalysis.expense) / basicAnalysis.income) * 100
            : 0;

        const budgetAlerts: BudgetAlert[] = budgets
            .filter((b) => b.percentage > 80)
            .map((b) => ({
                category: b.category?.name || b.category,
                spent: b.spent,
                limit: b.amount,
                percentage: b.percentage,
                isOver: b.percentage > 100
            }));

        return NextResponse.json({
            income: basicAnalysis.income,
            expense: basicAnalysis.expense,
            balance: basicAnalysis.balance,
            allocations: basicAnalysis.allocations,
            categoryBreakdown: basicAnalysis.categoryBreakdown,
            
            // ✨ NEW: Monthly stats for trends
            monthlyStats: monthlyComparison as MonthlyStat[],
            
            // ✨ NEW: Previous month data for comparison
            prevIncome: monthlyComparison && monthlyComparison.length > 1 ? monthlyComparison[monthlyComparison.length - 2]?.income : basicAnalysis.income,
            prevExpense: monthlyComparison && monthlyComparison.length > 1 ? monthlyComparison[monthlyComparison.length - 2]?.expense : basicAnalysis.expense,
            
            // ✨ NEW: Category stats for charts
            categoryStats: (topCategories as TopCategoryResult[]).map((cat): ChartCategoryStat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                total: Number(cat.totalAmount || 0)
            })),
            
            // ✨ NEW: Income stats by category/source
            incomeStats: basicAnalysis.categoryBreakdown?.income?.map((cat: CategoryBreakdown) => ({
                categoryId: cat.categoryId,
                name: cat.name,
                total: cat.amount
            })) || [],

            monthlyComparison,
            topCategories,
            spendingPatterns,
            goalsProgress,
            healthScore,
            cashflowPrediction: {
                nextMonth: (cashflowPrediction as CashflowResult).projections?.[0]?.projectedBalance || 0,
                trend: (cashflowPrediction as CashflowResult).trend === "positive" ? "up" : "down",
                confidence: 85
            },
            budgetAlerts,
            dailyStats,
            totalInvestments,
            passiveIncome,

            health,

            insights: canAccessAIInsights ? insights : null,
            canAccessAIInsights,
            hideBalance,

            summary: {
                avgDailySpending,
                savingsRate: Math.round(savingsRate),
                highestSpendingDay: spendingPatterns.highestSpendingDay,
                anomaliesCount: spendingPatterns.anomalies.length,
                goalsCount: goalsProgress.length,
                completedGoals: (goalsProgress as GoalProgress[]).filter((g) => g.progress >= 100).length,
                streakDays: streak?.currentStreak || 0
            } satisfies AnalyticsSummary
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Analytics API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: errorMessage
        }, { status: 500 });
    }
}
