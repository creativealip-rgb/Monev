import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    getAnalysisData,
    getFinancialHealthMetrics,
    getMonthlyComparison,
    getTopSpendingCategories,
    getSpendingPatterns,
    getGoalsProgress,
    calculateFinancialHealthScore,
    getCashflowPrediction,
    getBudgets,
    getDailyTransactionStats,
    getTotalInvestmentsValue
} from "@/backend/db/operations";
import { getFinancialInsights } from "@/lib/ai";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const searchParams = req.nextUrl.searchParams;
        const now = new Date();
        const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || now.getFullYear().toString());

        // Run all analytics in parallel
        const [
            basicAnalysis,
            health,
            monthlyComparison,
            topCategories,
            spendingPatterns,
            goalsProgress,
            healthScore,
            cashflowPrediction,
            budgets,
            dailyStats,
            totalInvestments
        ] = await Promise.all([
            getAnalysisData(userId, year, month),
            getFinancialHealthMetrics(userId),
            getMonthlyComparison(userId, 6),
            getTopSpendingCategories(userId, year, month, 5),
            getSpendingPatterns(userId, year, month),
            getGoalsProgress(userId),
            calculateFinancialHealthScore(userId),
            getCashflowPrediction(userId),
            getBudgets(userId, month, year),
            getDailyTransactionStats(userId, year, month),
            getTotalInvestmentsValue(userId)
        ]);

        // Generate AI insights based on the analysis data
        const insights = await getFinancialInsights(basicAnalysis);

        // Calculate additional metrics
        const avgDailySpending = spendingPatterns.averageDailySpending;
        const savingsRate = basicAnalysis.income > 0
            ? ((basicAnalysis.income - basicAnalysis.expense) / basicAnalysis.income) * 100
            : 0;

        // Budget alerts
        const budgetAlerts = budgets
            .filter(b => b.percentage > 80)
            .map(b => ({
                category: b.category,
                spent: b.spent,
                limit: b.amount,
                percentage: b.percentage,
                isOver: b.percentage > 100
            }));

        return NextResponse.json({
            // Basic analysis
            income: basicAnalysis.income,
            expense: basicAnalysis.expense,
            balance: basicAnalysis.balance,
            allocations: basicAnalysis.allocations,
            categoryBreakdown: basicAnalysis.categoryBreakdown,

            // New analytics
            monthlyComparison,
            topCategories,
            spendingPatterns,
            goalsProgress,
            healthScore,
            cashflowPrediction,
            budgetAlerts,
            dailyStats,
            totalInvestments,

            // Legacy health metrics
            health,

            // AI insights
            insights,

            // Summary stats
            summary: {
                avgDailySpending,
                savingsRate: Math.round(savingsRate),
                highestSpendingDay: spendingPatterns.highestSpendingDay,
                anomaliesCount: spendingPatterns.anomalies.length,
                goalsCount: goalsProgress.length,
                completedGoals: goalsProgress.filter(g => g.progress >= 100).length
            }
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
