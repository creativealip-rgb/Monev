import { NextRequest, NextResponse } from "next/server";
import { getMonthlyStats, getCategoryStats, getGoals, getBudgets } from "@/backend/db/operations";

// GET /api/dashboard - Get finance dashboard statistics
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Get all stats in parallel
        const [monthlyStats, categoryStats, goals, budgets] = await Promise.all([
            getMonthlyStats(year, month),
            getCategoryStats(year, month),
            getGoals(),
            getBudgets(month, year),
        ]);

        // Calculate additional metrics
        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
        const totalBudgets = budgets.length;
        const overBudgetCount = budgets.filter(b => b.spent > b.amount).length;

        return NextResponse.json({
            monthlyStats,
            categoryStats,
            goals: {
                total: totalGoals,
                completed: completedGoals,
                inProgress: totalGoals - completedGoals,
                list: goals,
            },
            budgets: {
                total: totalBudgets,
                overBudget: overBudgetCount,
                list: budgets,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}
