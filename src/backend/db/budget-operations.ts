import { getDb } from "./index";
import { budgets, transactions, categories, users } from "./schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Processes budget rollover for a specific user from one month to another.
 * Finds all budgets with enableRollover=true and carries over the remaining amount.
 */
export async function processBudgetRollover(userId: number, fromMonth: number, fromYear: number, toMonth: number, toYear: number) {
    const db = getDb();

    // 1. Get all budgets for the 'from' period that have rollover enabled
    const lastMonthBudgets = await db.select()
        .from(budgets)
        .where(and(
            eq(budgets.userId, userId),
            eq(budgets.month, fromMonth),
            eq(budgets.year, fromYear),
            eq(budgets.enableRollover, true)
        ))
        .all();

    if (lastMonthBudgets.length === 0) return { count: 0, totalAmount: 0 };

    let totalRollover = 0;

    for (const budget of lastMonthBudgets) {
        // 2. Calculate remaining amount (amount - spent)
        // Note: 'spent' should be up to date if tracked correctly, 
        // but we can also recalculate from transactions to be sure.
        const remaining = Math.max(0, budget.amount - budget.spent);

        if (remaining > 0) {
            // 3. Find or create the corresponding budget for the 'to' period
            const nextBudget = await db.select()
                .from(budgets)
                .where(and(
                    eq(budgets.userId, userId),
                    eq(budgets.categoryId, budget.categoryId),
                    eq(budgets.month, toMonth),
                    eq(budgets.year, toYear)
                ))
                .get();

            if (nextBudget) {
                // Update existing budget (add remaining to base amount)
                await db.update(budgets)
                    .set({
                        amount: nextBudget.amount + remaining
                    })
                    .where(eq(budgets.id, nextBudget.id));
            } else {
                // Create new budget with the rollover amount
                await db.insert(budgets)
                    .values({
                        userId,
                        categoryId: budget.categoryId,
                        amount: remaining,
                        month: toMonth,
                        year: toYear,
                        enableRollover: true
                    });
            }
            totalRollover += remaining;
        }
    }

    return { count: lastMonthBudgets.length, totalAmount: totalRollover };
}

/**
 * High-level function to trigger rollover for all users (e.g., from a cron job)
 */
export async function rolloverAllUsers(fromMonth: number, fromYear: number, toMonth: number, toYear: number) {
    const db = getDb();
    const allUsers = await db.select({ id: users.id }).from(users).all();

    const results = [];
    for (const user of allUsers) {
        const res = await processBudgetRollover(user.id, fromMonth, fromYear, toMonth, toYear);
        results.push({ userId: user.id, ...res });
    }

    return results;
}

/**
 * Apply a budget template for a user.
 */
export async function applyBudgetTemplate(userId: number, template: "50-30-20" | "minimalist" | "aggressive-saver", monthlyIncome: number, month: number, year: number) {
    const db = getDb();

    // Clear existing budgets for this month/year first? 
    // Or merge? Let's clear for a fresh start with templates.
    await db.delete(budgets)
        .where(and(
            eq(budgets.userId, userId),
            eq(budgets.month, month),
            eq(budgets.year, year)
        ));

    // Get user's categories to map them
    const userCategories = await db.select().from(categories)
        .where(sql`${categories.userId} IS NULL OR ${categories.userId} = ${userId}`)
        .all();

    const categoryMap: Record<string, number | undefined> = {};
    userCategories.forEach(c => {
        categoryMap[c.name.toLowerCase()] = c.id;
    });

    const budgetsToInsert = [];

    if (template === "50-30-20") {
        // 50% Needs, 30% Wants, 20% Savings/Debt
        const needs = monthlyIncome * 0.5;
        const wants = monthlyIncome * 0.3;
        const savings = monthlyIncome * 0.2;

        const needsId = categoryMap["kebutuhan"] || categoryMap["makan"] || categoryMap["transportasi"] || 1;
        const wantsId = categoryMap["keinginan"] || categoryMap["hiburan"] || categoryMap["belanja"] || 2;
        const savingsId = categoryMap["tabungan"] || categoryMap["investasi"] || 8;

        budgetsToInsert.push({ userId, categoryId: needsId, amount: needs, month, year });
        budgetsToInsert.push({ userId, categoryId: wantsId, amount: wants, month, year });
        budgetsToInsert.push({ userId, categoryId: savingsId, amount: savings, month, year });
    } else if (template === "minimalist") {
        // Needs (70%), Savings (30%)
        const needs = monthlyIncome * 0.7;
        const savings = monthlyIncome * 0.3;

        const needsId = categoryMap["kebutuhan"] || categoryMap["makan"] || 1;
        const savingsId = categoryMap["tabungan"] || categoryMap["investasi"] || 8;

        budgetsToInsert.push({ userId, categoryId: needsId, amount: needs, month, year });
        budgetsToInsert.push({ userId, categoryId: savingsId, amount: savings, month, year });
    } else if (template === "aggressive-saver") {
        // Needs (40%), Wants (10%), Savings (50%)
        const needs = monthlyIncome * 0.4;
        const wants = monthlyIncome * 0.1;
        const savings = monthlyIncome * 0.5;

        const needsId = categoryMap["kebutuhan"] || categoryMap["makan"] || 1;
        const wantsId = categoryMap["keinginan"] || categoryMap["hiburan"] || 2;
        const savingsId = categoryMap["tabungan"] || categoryMap["investasi"] || 8;

        budgetsToInsert.push({ userId, categoryId: needsId, amount: needs, month, year });
        budgetsToInsert.push({ userId, categoryId: wantsId, amount: wants, month, year });
        budgetsToInsert.push({ userId, categoryId: savingsId, amount: savings, month, year });
    }

    // Insert new budgets
    if (budgetsToInsert.length > 0) {
        for (const b of budgetsToInsert) {
            await db.insert(budgets).values({ ...b, spent: 0, enableRollover: true }).onConflictDoNothing();
        }
    }

    return budgetsToInsert;
}

/**
 * Calculates spending velocity and projected budget depletion for a user's budgets.
 */
export async function getSpendingVelocity(userId: number, month: number, year: number) {
    const db = getDb();

    // 1. Get all budgets for the month
    const userBudgets = await db.select()
        .from(budgets)
        .where(and(
            eq(budgets.userId, userId),
            eq(budgets.month, month),
            eq(budgets.year, year)
        ))
        .all();

    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();

    const results = userBudgets.map(budget => {
        const dailyRate = budget.spent / currentDay;
        const projectedTotal = dailyRate * daysInMonth;
        const isOverBudget = projectedTotal > budget.amount;

        // Calculate projected depletion date
        let projectedDepletionDate = null;
        if (dailyRate > 0) {
            const daysToDeplete = budget.amount / dailyRate;
            const depletionDate = new Date(year, month - 1, 1);
            depletionDate.setDate(depletionDate.getDate() + Math.floor(daysToDeplete));
            projectedDepletionDate = depletionDate;
        }

        return {
            categoryId: budget.categoryId,
            amount: budget.amount,
            spent: budget.spent,
            dailyRate,
            projectedTotal,
            isOverBudget,
            projectedDepletionDate,
            percentSpent: (budget.spent / budget.amount) * 100
        };
    });

    return results;
}
