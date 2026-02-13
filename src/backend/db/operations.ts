import { getDb } from "./index";
import { transactions, categories, budgets, goals, userSettings } from "./schema";
import type { Transaction, Category, Budget, Goal, UserSettings } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Re-export types
export type { Transaction, Category, Budget, Goal, UserSettings };

// Categories
export async function getCategories(): Promise<Category[]> {
    const db = getDb();
    return db.select().from(categories).all();
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
    const db = getDb();
    return db.select().from(categories).where(eq(categories.id, id)).get();
}

// Transactions
export async function getTransactions(limit = 50): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .orderBy(desc(transactions.date))
        .limit(limit)
        .all();
}

export async function getTransactionsByCategory(categoryId: number): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(eq(transactions.categoryId, categoryId))
        .orderBy(desc(transactions.date))
        .all();
}

export async function getTransactionById(id: number): Promise<Transaction | undefined> {
    const db = getDb();
    return db.select().from(transactions).where(eq(transactions.id, id)).get();
}

export async function createTransaction(data: {
    amount: number;
    description: string;
    merchantName?: string;
    categoryId: number;
    type: "expense" | "income";
    paymentMethod?: string;
    date: Date;
}): Promise<Transaction> {
    const db = getDb();
    const result = db.insert(transactions).values({
        ...data,
        isVerified: true,
        isRecurring: false,
    }).returning().get();

    return result;
}

export async function updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const db = getDb();
    const result = db.update(transactions)
        .set(data)
        .where(eq(transactions.id, id))
        .returning()
        .get();

    return result;
}

export async function deleteTransaction(id: number): Promise<void> {
    const db = getDb();
    await db.delete(transactions).where(eq(transactions.id, id));
}

// Statistics
export async function getMonthlyStats(year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
}> {
    const db = getDb();

    // Get all transactions and filter in JavaScript
    const allTransactions = await db.select().from(transactions).all();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const filteredTransactions = allTransactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= startDate && transDate <= endDate;
    });

    const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        income,
        expense,
        balance: income - expense,
    };
}

export async function getCategoryStats(year: number, month: number): Promise<Array<{
    categoryId: number;
    categoryName: string;
    color: string;
    total: number;
}>> {
    const db = getDb();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all transactions and categories
    const allTransactions = await db.select({
        transaction: transactions,
        category: categories,
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.type, "expense"))
        .all();

    // Filter by date in JavaScript
    const filtered = allTransactions.filter(({ transaction: t }) => {
        const transDate = new Date(t.date);
        return transDate >= startDate && transDate <= endDate;
    });

    // Group by category and sum amounts
    const categoryMap = new Map();
    filtered.forEach(({ transaction: t, category: c }) => {
        const existing = categoryMap.get(c.id) || { categoryId: c.id, categoryName: c.name, color: c.color, total: 0 };
        existing.total += t.amount;
        categoryMap.set(c.id, existing);
    });

    return Array.from(categoryMap.values())
        .sort((a, b) => b.total - a.total);
}

// Ensure sample budgets exist
async function ensureSampleBudgets(month: number, year: number) {
    const db = getDb();

    const existingBudgets = await db.select()
        .from(budgets)
        .where(and(
            eq(budgets.month, month),
            eq(budgets.year, year)
        ))
        .all();

    if (existingBudgets.length >= 3) return;

    const allCategories = await db.select().from(categories).all();
    const getCatId = (name: string) => allCategories.find(c => c.name === name)?.id;

    const sampleBudgets = [
        { categoryId: getCatId("Makan & Minuman")!, amount: 2500000, month, year },
        { categoryId: getCatId("Transportasi")!, amount: 1000000, month, year },
        { categoryId: getCatId("Hiburan")!, amount: 800000, month, year },
    ];

    for (const budget of sampleBudgets) {
        const exists = existingBudgets.some(b => b.categoryId === budget.categoryId);
        if (!exists) {
            await db.insert(budgets).values(budget);
        }
    }
}

// Budgets
export async function getBudgets(month: number, year: number): Promise<Array<Budget & { category: Category; spent: number }>> {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Ensure sample budgets exist for current month
    await ensureSampleBudgets(month, year);

    const budgetsWithCategories = await db.select({
        budget: budgets,
        category: categories,
    })
        .from(budgets)
        .innerJoin(categories, eq(budgets.categoryId, categories.id))
        .where(and(
            eq(budgets.month, month),
            eq(budgets.year, year)
        ))
        .all();

    // Get all transactions for the month
    const allTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.type, "expense"))
        .all();

    // Calculate spent for each budget
    const result = budgetsWithCategories.map((item) => {
        const spent = allTransactions
            .filter(t => {
                const transDate = new Date(t.date);
                return t.categoryId === item.budget.categoryId &&
                    transDate >= startDate &&
                    transDate <= endDate;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            ...item.budget,
            category: item.category,
            spent,
        };
    });

    return result;
}

// Budgets - Additional CRUD operations
export async function createBudget(data: {
    categoryId: number;
    amount: number;
    month: number;
    year: number;
}): Promise<Budget> {
    const db = getDb();
    return db.insert(budgets).values(data).returning().get();
}

export async function updateBudget(id: number, data: Partial<Budget>): Promise<Budget | undefined> {
    const db = getDb();
    return db.update(budgets)
        .set(data)
        .where(eq(budgets.id, id))
        .returning()
        .get();
}

export async function deleteBudget(id: number): Promise<void> {
    const db = getDb();
    await db.delete(budgets).where(eq(budgets.id, id));
}

// Ensure sample goals exist
async function ensureSampleGoals() {
    const db = getDb();

    const existingGoals = await db.select().from(goals).all();
    if (existingGoals.length >= 5) return;

    const sampleGoals = [
        { name: "MacBook Air M3", targetAmount: 20000000, currentAmount: 8500000, deadline: new Date("2026-06-01"), icon: "💻", color: "#3b82f6" },
        { name: "Emergency Fund", targetAmount: 30000000, currentAmount: 12500000, deadline: new Date("2026-12-31"), icon: "🛡️", color: "#22c55e" },
        { name: "Liburan Jepang", targetAmount: 35000000, currentAmount: 5200000, deadline: new Date("2026-08-01"), icon: "✈️", color: "#f97316" },
        { name: "iPhone 16 Pro", targetAmount: 18000000, currentAmount: 6200000, deadline: new Date("2026-05-01"), icon: "📱", color: "#a855f7" },
        { name: "Motor NMAX", targetAmount: 35000000, currentAmount: 15000000, deadline: new Date("2026-09-01"), icon: "🏍️", color: "#ec4899" },
    ];

    for (const goal of sampleGoals) {
        const exists = existingGoals.some(g => g.name === goal.name);
        if (!exists) {
            await db.insert(goals).values(goal);
        }
    }
}

// Goals - Full CRUD operations
export async function getGoals(): Promise<Goal[]> {
    await ensureSampleGoals();
    const db = getDb();
    return db.select().from(goals).all();
}

export async function getGoalById(id: number): Promise<Goal | undefined> {
    const db = getDb();
    return db.select().from(goals).where(eq(goals.id, id)).get();
}

export async function createGoal(data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: Date;
    icon?: string;
    color?: string;
}): Promise<Goal> {
    const db = getDb();
    return db.insert(goals).values({
        ...data,
        currentAmount: data.currentAmount || 0,
        icon: data.icon || "Target",
        color: data.color || "#3b82f6",
    }).returning().get();
}

export async function updateGoal(id: number, data: Partial<Goal>): Promise<Goal | undefined> {
    const db = getDb();
    return db.update(goals)
        .set(data)
        .where(eq(goals.id, id))
        .returning()
        .get();
}

export async function updateGoalProgress(id: number, amount: number): Promise<Goal | undefined> {
    const db = getDb();
    const goal = await getGoalById(id);
    if (!goal) return undefined;

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);

    return db.update(goals)
        .set({ currentAmount: newAmount })
        .where(eq(goals.id, id))
        .returning()
        .get();
}

export async function getRecentTransactionsByCategory(categoryId: number, limit: number = 5): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(eq(transactions.categoryId, categoryId))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .all();
}

// User Settings
export async function getUserSettings(): Promise<UserSettings> {
    const db = getDb();
    let settings = db.select().from(userSettings).get();

    if (!settings) {
        // Create default settings if not exists
        settings = db.insert(userSettings).values({
            hourlyRate: 50000,
        }).returning().get();
    }

    return settings;
}

export async function updateUserSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    const db = getDb();
    const settings = await getUserSettings();

    return db.update(userSettings)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(userSettings.id, settings.id))
        .returning()
        .get();
}
