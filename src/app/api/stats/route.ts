import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMonthlyStats, getBudgets, getDebts, getUserStreak, getGoals, getUserSettings } from "@/backend/db/operations";
import { getAccounts } from "@/backend/db/account-operations";
import { calculateHealthScore } from "@/lib/health-score";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        const stats = await getMonthlyStats(userId, year, month);

        // Fetch total assets for comprehensive balance
        const { getAssetsValue } = await import("@/backend/db/operations");
        const assets = await getAssetsValue(userId);

        // Fetch total from all accounts (bank, emoney, investments, etc)
        let totalAccounts = 0;
        let accountCount = 0;
        try {
            const accountsList = await getAccounts(userId);
            totalAccounts = accountsList.reduce((sum, acc) => {
                if (acc.type === 'credit_card') return sum - acc.balance;
                return sum + acc.balance;
            }, 0);
            accountCount = accountsList.length;
            console.log(`[stats] User ${userId}: totalAccounts=${totalAccounts}, accountCount=${accountCount}, accounts=${accountsList.length}`);
        } catch (error) {
            console.error('[stats] Error fetching accounts:', error);
            // Fallback to 0 if accounts table doesn't exist or other error
        }
        console.log(`[stats] Response data:`, {
            balance: stats.balance,
            totalAccounts,
            accountCount,
            totalGoals: assets.totalGoals,
            totalInvestments: assets.totalInvestments
        });

        // Get previous month stats for comparison
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        const prevStats = await getMonthlyStats(userId, prevYear, prevMonth);

        // Calculate growth percentage
        let growth = 0;
        if (prevStats.balance !== 0) {
            growth = ((stats.balance - prevStats.balance) / Math.abs(prevStats.balance)) * 100;
        } else if (stats.balance !== 0) {
            growth = 100; // From 0 to something is considered 100% growth
        }

        // --- Calculate Health Score ---
        // Fetch all required data concurrently
        const [budgets, goals, unpaidDebts, streak, settings] = await Promise.all([
            getBudgets(userId, month, year),
            getGoals(userId),
            getDebts(userId, "unpaid"),
            getUserStreak(userId),
            getUserSettings(userId)
        ]);

        let totalOwe = 0;
        let totalOwed = 0;

        unpaidDebts.forEach((d: any) => {
            if (d.description?.startsWith("[OWED]")) {
                totalOwed += d.amount;
            } else {
                totalOwe += d.amount;
            }
        });

        const totalBudget = budgets.reduce((sum: number, budget: any) => sum + Number(budget.amount || 0), 0);
        const totalBudgetSpent = budgets.reduce((sum: number, budget: any) => sum + Number(budget.spent || 0), 0);
        const budgetRemaining = Math.max(0, totalBudget - totalBudgetSpent);

        const healthScore = calculateHealthScore({
            income: stats.income,
            expense: stats.expense,
            streakDays: streak?.currentStreak || 0,
            budgets: budgets.map((b: any) => ({ amount: b.amount, spent: b.spent })),
            goalsCount: goals.length,
            totalOwe,
            totalOwed
        });

        // Calculate income/expense growth percentages
        let incomeGrowth = 0;
        if (prevStats.income !== 0) {
            incomeGrowth = ((stats.income - prevStats.income) / Math.abs(prevStats.income)) * 100;
        } else if (stats.income !== 0) {
            incomeGrowth = 100;
        }

        let expenseGrowth = 0;
        if (prevStats.expense !== 0) {
            expenseGrowth = ((stats.expense - prevStats.expense) / Math.abs(prevStats.expense)) * 100;
        } else if (stats.expense !== 0) {
            expenseGrowth = 100;
        }

        return NextResponse.json({
            success: true,
            data: {
                ...stats,
                ...assets,
                totalAccounts,
                accountCount,
                monthlyIncome: settings?.monthlyIncome || 0,
                weeklyBudgetTotal: totalBudget,
                weeklyBudgetSpent: totalBudgetSpent,
                weeklyBudgetRemaining: budgetRemaining,
                growth,
                incomeGrowth,
                expenseGrowth,
                prevIncome: prevStats.income,
                prevExpense: prevStats.expense,
                healthScore,
                streak: {
                    current: streak?.currentStreak || 0,
                    longest: streak?.longestStreak || 0
                }
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
