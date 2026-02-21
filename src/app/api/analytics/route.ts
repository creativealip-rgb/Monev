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
    calculateFinancialHealthScore,
    getCashflowPrediction,
    getBudgets,
    getDailyTransactionStats,
    getTotalInvestmentsValue
} from "@/backend/db/operations";
import { getFinancialInsights } from "@/lib/ai";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

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

async function setCachedInsights(userId: number, month: number, year: number, insights: string): Promise<void> {
    try {
        const db = getDb();
        
        const existing = await db.select()
            .from(aiInsightsCache)
            .where(and(
                eq(aiInsightsCache.userId, userId),
                eq(aiInsightsCache.month, month),
                eq(aiInsightsCache.year, year)
            ))
            .get();

        if (existing) {
            await db.update(aiInsightsCache)
                .set({
                    insights,
                    updatedAt: new Date()
                })
                .where(eq(aiInsightsCache.id, existing.id))
                .run();
        } else {
            await db.insert(aiInsightsCache).values({
                userId,
                month,
                year,
                insights,
            }).run();
        }
    } catch (error) {
        console.error("[setCachedInsights] Error:", error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const searchParams = req.nextUrl.searchParams;
        const now = new Date();
        const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || now.getFullYear().toString());

        const db = getDb();
        const user = await db.select({ tier: users.tier })
            .from(users)
            .where(eq(users.id, userId))
            .get();
        
        const userTier = user?.tier || "miskin";
        const canAccessAIInsights = userTier === "kaya" || userTier === "sultan";

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

        let insights: string | null = null;
        
        if (canAccessAIInsights) {
            insights = await getCachedInsights(userId, month, year);
            
            if (!insights) {
                try {
                    const generatedInsights = await getFinancialInsights(basicAnalysis);
                    insights = generatedInsights;
                    await setCachedInsights(userId, month, year, insights);
                } catch (aiError) {
                    console.error("AI Insights generation failed:", aiError);
                    insights = "Gagal menghasilkan analisa AI saat ini. Coba lagi nanti.";
                }
            }
        }

        const avgDailySpending = spendingPatterns.averageDailySpending;
        const savingsRate = basicAnalysis.income > 0
            ? ((basicAnalysis.income - basicAnalysis.expense) / basicAnalysis.income) * 100
            : 0;

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
            income: basicAnalysis.income,
            expense: basicAnalysis.expense,
            balance: basicAnalysis.balance,
            allocations: basicAnalysis.allocations,
            categoryBreakdown: basicAnalysis.categoryBreakdown,

            monthlyComparison,
            topCategories,
            spendingPatterns,
            goalsProgress,
            healthScore,
            cashflowPrediction,
            budgetAlerts,
            dailyStats,
            totalInvestments,

            health,

            insights: canAccessAIInsights ? insights : null,
            canAccessAIInsights,

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
