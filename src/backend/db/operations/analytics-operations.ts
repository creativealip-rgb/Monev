import { getDb } from "../index";
import { categories, transactions } from "../schema";
import { eq, and, sql, gte, lte, or, inArray, desc, notLike } from "drizzle-orm";
import { getGoals } from "./goal-operations";
import { calculateRunway } from "@/lib/financial-advising";
import { detectSubscriptions } from "@/lib/subscription-detector";
import type { Transaction as AppTransaction } from "@/types";

export interface AnalyticsFilters {
    accountId?: number;
    categoryId?: number;
}

function buildTransactionFilters(
    userId: number,
    startDate: Date,
    endDate: Date,
    filters?: AnalyticsFilters,
    transactionTypes?: Array<"expense" | "income" | "transfer" | "withdraw">
) {
    return and(
        eq(transactions.userId, userId),
        transactionTypes && transactionTypes.length > 0
            ? or(...transactionTypes.map((type) => eq(transactions.type, type)))
            : undefined,
        filters?.accountId ? eq(transactions.accountId, filters.accountId) : undefined,
        filters?.categoryId ? eq(transactions.categoryId, filters.categoryId) : undefined,
        notLike(transactions.description, "[OPENING_BALANCE]%"),
        notLike(transactions.description, "[BALANCE_ADJUSTMENT]%"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
    );
}

// Statistics
export async function getMonthlyStats(
    userId: number,
    year: number,
    month: number,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
): Promise<{
    income: number;
    expense: number;
    balance: number;
    fees: number;
}> {
    const db = getDb();

    // Optimized: Use SQL filtering instead of JavaScript filtering
    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59, 999);

    // Get income transactions (plus withdrawals from assets)
    const incomeResult = await db
        .select({ total: sql<number>`SUM(amount)` })
        .from(transactions)
        .where(buildTransactionFilters(userId, startDate, endDate, filters, ["income", "withdraw"]))
        .get();

    // Get expense transactions (plus transfers to assets)
    const expenseResult = await db
        .select({ total: sql<number>`SUM(amount)` })
        .from(transactions)
        .where(buildTransactionFilters(userId, startDate, endDate, filters, ["expense"]))
        .get();

    // Get fees total
    const feesResult = await db
        .select({ total: sql<number>`SUM(fee)` })
        .from(transactions)
        .where(buildTransactionFilters(userId, startDate, endDate, filters))
        .get();

    const income = incomeResult?.total || 0;
    const expense = expenseResult?.total || 0;
    const fees = feesResult?.total || 0;

    return {
        income,
        expense,
        balance: income - expense,
        fees,
    };
}

export async function getDailyTransactionStats(
    userId: number,
    year: number,
    month: number,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
): Promise<Array<{ date: string; count: number; total: number }>> {
    const db = getDb();
    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59, 999);

    const entries = await db.select({
        date: transactions.date,
        amount: transactions.amount,
        type: transactions.type
    })
        .from(transactions)
        .where(buildTransactionFilters(userId, startDate, endDate, filters, ["expense"]))
        .all();

    // Aggregate in JS to avoid complex SQLite date formatting compatibility issues
    const stats: Record<string, { count: number; total: number }> = {};

    entries.forEach(t => {
        const dateStr = new Date(t.date).toISOString().split('T')[0];
        if (!stats[dateStr]) {
            stats[dateStr] = { count: 0, total: 0 };
        }
        stats[dateStr].count++;
        stats[dateStr].total += t.amount;
    });

    return Object.entries(stats).map(([date, data]) => ({
        date,
        ...data
    })).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCategoryStats(
    userId: number,
    year: number,
    month: number,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
): Promise<Array<{
    categoryId: number;
    categoryName: string;
    color: string;
    total: number;
}>> {
    const db = getDb();

    // Optimized: Use SQL aggregation and filtering
    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59, 999);

    // Use SQL GROUP BY for efficient aggregation
    const results = await db.select({
        categoryId: categories.id,
        categoryName: categories.name,
        color: categories.color,
        total: sql<number>`SUM(${transactions.amount})`,
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(buildTransactionFilters(userId, startDate, endDate, filters, ["expense"]))
        .groupBy(categories.id)
        .orderBy(sql`SUM(${transactions.amount}) DESC`)
        .all();

    return results.map(r => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        color: r.color,
        total: r.total || 0,
    }));
}

export async function getAnalysisData(
    userId: number,
    year: number,
    month: number,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
) {
    const db = getDb();

    const stats = await getMonthlyStats(userId, year, month, dateRange, filters);

    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59, 999);

    // Optimized: Fetch only monthly transactions with SQL filtering
    const monthlyTransactions = await db.select({
        transaction: transactions,
        category: categories,
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(buildTransactionFilters(userId, startDate, endDate, filters))
        .all();

    const mapping = {
        needs: ["Makan & Minuman", "Transportasi", "Tagihan", "Kesehatan", "Pendidikan"],
        wants: ["Hiburan", "Belanja", "Lainnya"],
        savings: ["Investasi", "Tabungan", "Tabungan & Investasi"]
    };

    let needsAmount = 0;
    let wantsAmount = 0;
    let investmentAmount = 0;

    // Detailed breakdowns
    const expenseBreakdown: Record<string, { categoryId: number; amount: number; color: string; icon: string }> = {};
    const incomeBreakdown: Record<string, { categoryId: number; amount: number; color: string; icon: string }> = {};

    monthlyTransactions.forEach(({ transaction: t, category: cat }) => {
        if (t.type === 'expense') {
            // Rule 50/30/20 calculation
            if (mapping.needs.includes(cat.name)) {
                needsAmount += t.amount;
            } else if (mapping.wants.includes(cat.name)) {
                wantsAmount += t.amount;
            } else if (mapping.savings.includes(cat.name)) {
                investmentAmount += t.amount;
            }

            // Category breakdown calculation
            if (!expenseBreakdown[cat.name]) {
                expenseBreakdown[cat.name] = {
                    categoryId: cat.id,
                    amount: 0,
                    color: cat.color,
                    icon: cat.icon
                };
            }
            expenseBreakdown[cat.name].amount += t.amount;
        } else if (t.type === 'income') {
            if (!incomeBreakdown[cat.name]) {
                incomeBreakdown[cat.name] = {
                    categoryId: cat.id,
                    amount: 0,
                    color: cat.color,
                    icon: cat.icon
                };
            }
            incomeBreakdown[cat.name].amount += t.amount;
        }
    });

    const totalSavings = investmentAmount + Math.max(0, stats.balance);

    return {
        income: stats.income,
        expense: stats.expense,
        balance: stats.balance,
        allocations: [
            {
                name: "Kebutuhan",
                amount: needsAmount,
                percentage: stats.income > 0 ? Math.round((needsAmount / stats.income) * 100) : 0,
                target: 50,
                color: "orange"
            },
            {
                name: "Keinginan",
                amount: wantsAmount,
                percentage: stats.income > 0 ? Math.round((wantsAmount / stats.income) * 100) : 0,
                target: 30,
                color: "rose"
            },
            {
                name: "Tabungan",
                amount: totalSavings,
                percentage: stats.income > 0 ? Math.round((totalSavings / stats.income) * 100) : 0,
                target: 20,
                color: "blue"
            }
        ],
        categoryBreakdown: {
            expense: Object.entries(expenseBreakdown).map(([name, data]) => ({ name, ...data })),
            income: Object.entries(incomeBreakdown).map(([name, data]) => ({ name, ...data }))
        }
    };
}

// ============ Advanced Analytics Functions ============

export async function getMonthlyComparison(userId: number, months: number = 6, filters?: AnalyticsFilters) {
    const now = new Date();
    const comparisons = [];

    for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const stats = await getMonthlyStats(userId, date.getFullYear(), date.getMonth() + 1, undefined, filters);
        comparisons.push({
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            monthName: date.toLocaleString('id-ID', { month: 'short' }),
            income: stats.income,
            expense: stats.expense,
            balance: stats.balance
        });
    }

    return comparisons.reverse();
}

export async function getTopSpendingCategories(
    userId: number,
    year: number,
    month: number,
    limit: number = 5,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
) {
    const db = getDb();

    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59, 999);

    const results = await db.select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        totalAmount: sql<number>`SUM(${transactions.amount})`.as('totalAmount'),
        transactionCount: sql<number>`COUNT(*)`.as('transactionCount')
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(buildTransactionFilters(userId, startDate, endDate, filters, ["expense"]))
        .groupBy(transactions.categoryId)
        .orderBy(sql`totalAmount DESC`)
        .limit(limit)
        .all();

    // Get previous month for trend comparison
    const shouldCompareWithPreviousMonth = !dateRange;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    const prevResults = shouldCompareWithPreviousMonth
        ? await db.select({
            categoryId: transactions.categoryId,
            totalAmount: sql<number>`SUM(${transactions.amount})`.as('totalAmount')
        })
            .from(transactions)
            .where(buildTransactionFilters(userId, prevStartDate, prevEndDate, filters, ["expense"]))
            .groupBy(transactions.categoryId)
            .all()
        : [];

    const prevMap = new Map(prevResults.map(r => [r.categoryId, r.totalAmount]));

    return results.map(r => {
        const prevAmount = prevMap.get(r.categoryId) || 0;
        const change = prevAmount > 0 ? ((r.totalAmount - prevAmount) / prevAmount) * 100 : 0;
        return {
            ...r,
            change,
            isIncrease: change > 0
        };
    });
}

export async function getSpendingPatterns(
    userId: number,
    year: number,
    month: number,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
) {
    const db = getDb();

    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59, 999);

    // Daily spending for heatmap
    const dailySpending = await db.select({
        date: sql<string>`strftime('%Y-%m-%d', ${transactions.date} / 1000, 'unixepoch')`.as('date'),
        dayOfWeek: sql<number>`CAST(strftime('%w', ${transactions.date} / 1000, 'unixepoch') AS INTEGER)`.as('dayOfWeek'),
        dayOfMonth: sql<number>`CAST(strftime('%d', ${transactions.date} / 1000, 'unixepoch') AS INTEGER)`.as('dayOfMonth'),
        totalAmount: sql<number>`SUM(${transactions.amount})`.as('totalAmount'),
        transactionCount: sql<number>`COUNT(*)`.as('transactionCount')
    })
        .from(transactions)
        .where(buildTransactionFilters(userId, startDate, endDate, filters, ["expense"]))
        .groupBy(sql`date`)
        .all();

    // Find highest spending day
    const maxSpending = dailySpending.length > 0
        ? dailySpending.reduce((max, day) => day.totalAmount > max.totalAmount ? day : max, dailySpending[0])
        : null;

    // Average daily spending
    const avgDaily = dailySpending.length > 0
        ? dailySpending.reduce((sum, day) => sum + day.totalAmount, 0) / dailySpending.length
        : 0;

    // Detect anomalies with severity instead of a flat threshold.
    const anomalies = dailySpending
        .filter((day) => avgDaily > 0 && day.totalAmount > avgDaily * 1.5)
        .map((day) => {
            const ratioToAverage = avgDaily > 0 ? day.totalAmount / avgDaily : 0;

            let severity: "low" | "medium" | "high" = "low";
            if (ratioToAverage >= 3) {
                severity = "high";
            } else if (ratioToAverage >= 2) {
                severity = "medium";
            }

            let insight = "Pengeluaran hari ini mulai di atas pola normal.";
            if (severity === "high") {
                insight = "Lonjakan belanja sangat tinggi. Hari ini jauh di atas pola rata-rata bulanan.";
            } else if (severity === "medium") {
                insight = "Pengeluaran melonjak cukup tajam dibanding rata-rata harian.";
            }

            return {
                ...day,
                ratioToAverage,
                severity,
                insight
            };
        })
        .sort((a, b) => b.ratioToAverage - a.ratioToAverage);

    return {
        dailySpending,
        highestSpendingDay: maxSpending,
        averageDailySpending: avgDaily,
        anomalies,
        totalSpendingDays: dailySpending.length
    };
}

export async function getGoalsProgress(userId: number) {
    const goalsList = await getGoals(userId);

    const now = new Date();

    return goalsList.map(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        let estimatedDays = null;

        if (goal.deadline && progress < 100) {
            const amountLeft = goal.targetAmount - goal.currentAmount;

            // Simple estimation based on linear progress
            const daysSinceStart = Math.ceil((now.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const monthlyProgress = daysSinceStart > 0 ? (goal.currentAmount / daysSinceStart) * 30 : 0;

            if (monthlyProgress > 0) {
                estimatedDays = Math.ceil(amountLeft / (monthlyProgress / 30));
            }
        }

        return {
            ...goal,
            progress,
            estimatedDays,
            amountLeft: Math.max(0, goal.targetAmount - goal.currentAmount)
        };
    });
}

interface HealthScoreBreakdown {
    savingsRate: number;
    expenseControl: number;
    balanceHealth: number;
    consistency: number;
}

function generateRecommendations(scores: HealthScoreBreakdown) {
    const recommendations: string[] = [];

    if (scores.savingsRate < 50) {
        recommendations.push('Tingkatkan tabungan minimal 20% dari pendapatan');
    }

    if (scores.expenseControl < 50) {
        recommendations.push('Kurangi pengeluaran, idealnya < 80% dari pendapatan');
    }

    if (scores.balanceHealth < 50) {
        recommendations.push('Bangun emergency fund minimal 3 bulan pengeluaran');
    }

    if (scores.consistency < 50) {
        recommendations.push('Usahakan pengeluaran lebih konsisten tiap bulan');
    }

    if (recommendations.length === 0) {
        recommendations.push('Pertahankan kebiasaan keuangan yang baik!');
    }

    return recommendations;
}

export async function calculateFinancialHealthScore(userId: number) {
    const now = new Date();

    // Get last 3 months data for scoring
    const monthlyData = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const stats = await getMonthlyStats(userId, date.getFullYear(), date.getMonth() + 1);
        monthlyData.push(stats);
    }

    const avgIncome = monthlyData.reduce((sum, m) => sum + m.income, 0) / monthlyData.length;
    const avgExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0) / monthlyData.length;
    const currentBalance = monthlyData[0]?.balance || 0;

    // Calculate scores (each 0-100)
    const scores = {
        savingsRate: 0,
        expenseControl: 0,
        balanceHealth: 0,
        consistency: 0
    };

    // Savings rate score (ideal: 20%+)
    if (avgIncome > 0) {
        const savingsRate = ((avgIncome - avgExpense) / avgIncome) * 100;
        scores.savingsRate = Math.min(100, Math.max(0, (savingsRate / 20) * 100));
    }

    // Expense control score (expense should be < 80% of income)
    if (avgIncome > 0) {
        const expenseRatio = avgExpense / avgIncome;
        scores.expenseControl = Math.min(100, Math.max(0, (1 - expenseRatio) * 100));
    }

    // Balance health score (should have 3+ months of expenses saved)
    if (avgExpense > 0) {
        const monthsOfExpenses = currentBalance / avgExpense;
        scores.balanceHealth = Math.min(100, (monthsOfExpenses / 3) * 100);
    }

    // Consistency score (low variance in savings)
    if (monthlyData.length >= 2) {
        const savings = monthlyData.map(m => m.income - m.expense);
        const avgSavings = savings.reduce((sum, s) => sum + s, 0) / savings.length;
        const variance = savings.reduce((sum, s) => sum + Math.pow(s - avgSavings, 2), 0) / savings.length;
        const stdDev = Math.sqrt(variance);

        // Lower standard deviation = higher consistency
        scores.consistency = Math.max(0, 100 - (stdDev / Math.abs(avgSavings || 1)) * 50);
    }

    const totalScore = Math.round((scores.savingsRate + scores.expenseControl + scores.balanceHealth + scores.consistency) / 4);

    let status = 'poor';
    let message = 'Perlu perbaikan';
    if (totalScore >= 80) {
        status = 'excellent';
        message = 'Sangat sehat';
    } else if (totalScore >= 60) {
        status = 'good';
        message = 'Cukup baik';
    } else if (totalScore >= 40) {
        status = 'fair';
        message = 'Perhatian diperlukan';
    }

    return {
        totalScore,
        status,
        message,
        breakdown: scores,
        recommendations: generateRecommendations(scores)
    };
}

export async function getCashflowPrediction(userId: number) {
    const now = new Date();

    // Get last 6 months for trend
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const stats = await getMonthlyStats(userId, date.getFullYear(), date.getMonth() + 1);
        monthlyData.push(stats);
    }

    // Simple linear projection
    const balances = monthlyData.map(m => m.balance);
    const avgBalance = balances.reduce((sum, b) => sum + b, 0) / balances.length;

    // Project next 3 months
    const projections = [];
    let projectedBalance = monthlyData[monthlyData.length - 1].balance;

    for (let i = 1; i <= 3; i++) {
        projectedBalance += avgBalance;
        projections.push({
            month: now.getMonth() + 1 + i,
            year: now.getFullYear(),
            projectedBalance: Math.round(projectedBalance)
        });
    }

    return {
        historical: monthlyData,
        projections,
        trend: avgBalance >= 0 ? 'positive' : 'negative'
    };
}

export async function getPassiveIncome(
    userId: number,
    year: number,
    month: number,
    dateRange?: { startDate: Date; endDate: Date },
    filters?: AnalyticsFilters
): Promise<number> {
    const db = getDb();
    const startDate = dateRange?.startDate || new Date(year, month - 1, 1);
    const endDate = dateRange?.endDate || new Date(year, month, 0, 23, 59, 59);

    // Categories that count as passive income
    const passiveCats = ["Investasi", "Dividen", "Bunga", "Passive Income", "Pendapatan Pasif"];

    const cats = await db.select().from(categories).all();
    const targetCatIds = cats
        .filter(c => passiveCats.some(pc => c.name.toLowerCase().includes(pc.toLowerCase())))
        .map(c => c.id);

    if (targetCatIds.length === 0) return 0;

    const result = await db.select({ total: sql<number>`SUM(${transactions.amount})` })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "income"),
            filters?.accountId ? eq(transactions.accountId, filters.accountId) : undefined,
            inArray(transactions.categoryId, targetCatIds),
            filters?.categoryId ? eq(transactions.categoryId, filters.categoryId) : undefined,
            notLike(transactions.description, "[OPENING_BALANCE]%"),
            notLike(transactions.description, "[BALANCE_ADJUSTMENT]%"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .get();

    return result?.total || 0;
}

export async function getFinancialHealthMetrics(userId: number) {
    const now = new Date();
    // Placeholder - requires simple stats logic
    const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
    const goalsList = await getGoals(userId);
    const totalGoalProgress = goalsList.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalGoalTarget = goalsList.reduce((acc, g) => acc + g.targetAmount, 0);

    return {
        monthlyBalance: stats.balance,
        savingsRate: stats.income > 0 ? (stats.balance / stats.income) * 100 : 0,
        goalCompletion: totalGoalTarget > 0 ? (totalGoalProgress / totalGoalTarget) * 100 : 0,
        runwayMonths: calculateRunway(stats.balance, stats.expense)
    };
}

// Advanced Features
export async function analyzeSubscriptions(userId: number, monthsBack = 3): Promise<Array<{ merchant: string, amount: number, frequency: string, lastDate: Date, confidence: number }>> {
    const db = getDb();
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - monthsBack);

    // Get all transactions for user
    const userTransactions = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            gte(transactions.date, startDate)
        ))
        .orderBy(desc(transactions.date))
        .all();

    // Mapping Transaction from DB to generic Transaction type if needed
    // In this codebase, they seem to be the same or very similar.
    const patterns = detectSubscriptions(userTransactions as AppTransaction[]);

    return patterns.map(p => ({
        merchant: p.merchantName,
        amount: p.avgAmount,
        frequency: p.frequency,
        lastDate: p.lastDate,
        confidence: p.confidence
    }));
}
