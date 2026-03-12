import { getDb } from "../index";
import { budgets, categories, transactions } from "../schema";
import type { Budget, Category } from "../schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function getBudgets(userId: number, month: number, year: number): Promise<Array<Budget & { category: Category; spent: number; percentage: number }>> {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgetsWithCategories = await db.select({
        budget: budgets,
        category: categories,
    })
        .from(budgets)
        .innerJoin(categories, eq(budgets.categoryId, categories.id))
        .where(and(
            eq(budgets.userId, userId),
            eq(budgets.month, month),
            eq(budgets.year, year)
        ))
        .all();

    // Optimized: Use SQL aggregation for spent calculation
    const spentByCategory = await db.select({
        categoryId: transactions.categoryId,
        total: sql<number>`SUM(${transactions.amount})`,
    })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .groupBy(transactions.categoryId)
        .all();

    // Create lookup map for spent amounts
    const spentMap = new Map(spentByCategory.map(s => [s.categoryId, s.total || 0]));

    // Map budgets with spent amounts
    const result = budgetsWithCategories.map((item) => {
        const spent = spentMap.get(item.budget.categoryId) || 0;
        const percentage = item.budget.amount > 0 ? (spent / item.budget.amount) * 100 : 0;
        return {
            ...item.budget,
            category: item.category,
            spent,
            percentage,
        };
    });

    return result;
}

// Budgets - Additional CRUD operations
export async function createBudget(userId: number, data: {
    categoryId: number;
    amount: number;
    month: number;
    year: number;
    enableRollover?: boolean;
}): Promise<Budget> {
    const db = getDb();
    return db.insert(budgets).values({ ...data, userId }).returning().get();
}

export async function updateBudget(userId: number, id: number, data: Partial<Budget>): Promise<Budget | undefined> {
    const db = getDb();
    return db.update(budgets)
        .set(data)
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
        .returning()
        .get();
}

export async function deleteBudget(userId: number, id: number): Promise<void> {
    const db = getDb();
    await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
}
