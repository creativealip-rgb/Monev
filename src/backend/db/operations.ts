import { getDb } from "./index";
import { transactions, categories, budgets, goals, userSettings, users, debts, scheduledMessages, bills, investments, merchantMappings, chatHistory, coupons } from "./schema";
import type { Transaction, Category, Budget, Goal, UserSettings, User, Debt, ScheduledMessage, Bill, Investment, ChatHistory, Coupon } from "./schema";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { calculateRunway, calculateIdleCash } from "@/lib/financial-advising";

// Re-export types
export type { Transaction, Category, Budget, Goal, UserSettings, User, Debt, Bill, Investment, ChatHistory, Coupon };

// Categories (Global for now)
export async function getCategories(): Promise<Category[]> {
    const db = getDb();
    return db.select().from(categories).all();
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
    const db = getDb();
    return db.select().from(categories).where(eq(categories.id, id)).get();
}

// Transactions with pagination and search support
export interface GetTransactionsOptions {
    limit?: number;
    offset?: number;
    search?: string;
    categoryId?: number;
    type?: "expense" | "income" | "all";
    startDate?: Date;
    endDate?: Date;
}

export async function getTransactions(userId: number, limit = 50, offset = 0, search?: string): Promise<Transaction[]> {
    const db = getDb();

    const conditions = [eq(transactions.userId, userId)];

    if (search) {
        conditions.push(
            sql`(${transactions.description} LIKE ${'%' + search + '%'} OR ${transactions.merchantName} LIKE ${'%' + search + '%'})`
        );
    }

    return db.select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .offset(offset)
        .all();
}

// Get total transaction count (for pagination)
export async function getTransactionsCount(userId: number, search?: string): Promise<number> {
    const db = getDb();

    let query = db.select({ count: sql<number>`COUNT(*)` }).from(transactions).where(eq(transactions.userId, userId));

    if (search) {
        query = db.select({ count: sql<number>`COUNT(*)` })
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                sql`(${transactions.description} LIKE ${'%' + search + '%'} OR ${transactions.merchantName} LIKE ${'%' + search + '%'})`
            ));
    }

    const result = await query.get();
    return result?.count || 0;
}

export async function getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, categoryId)
        ))
        .orderBy(desc(transactions.date))
        .all();
}

export async function getTransactionById(userId: number, id: number): Promise<Transaction | undefined> {
    const db = getDb();
    return db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).get();
}

export async function createTransaction(userId: number, data: {
    amount: number;
    description: string;
    merchantName?: string;
    categoryId: number;
    type: "expense" | "income" | "transfer";
    paymentMethod?: string;
    date: Date;
}): Promise<Transaction> {
    const db = getDb();
    const result = db.insert(transactions).values({
        userId,
        ...data,
        isVerified: true,
        isRecurring: false,
    }).returning().get();

    return result;
}

export async function updateTransaction(userId: number, id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const db = getDb();
    const result = db.update(transactions)
        .set(data)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning()
        .get();

    return result;
}

export async function deleteTransaction(userId: number, id: number): Promise<void> {
    const db = getDb();
    await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

// Statistics
export async function getMonthlyStats(userId: number, year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
}> {
    const db = getDb();

    // Optimized: Use SQL filtering instead of JavaScript filtering
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get income transactions (plus withdrawals from assets)
    const incomeResult = await db
        .select({ total: sql<number>`SUM(amount)` })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            or(eq(transactions.type, "income"), eq(transactions.type, "withdraw")), // Include withdrawals
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .get();

    // Get expense transactions (plus transfers to assets)
    const expenseResult = await db
        .select({ total: sql<number>`SUM(amount)` })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            or(eq(transactions.type, "expense"), eq(transactions.type, "transfer")), // Include transfers
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .get();

    const income = incomeResult?.total || 0;
    const expense = expenseResult?.total || 0;

    return {
        income,
        expense,
        balance: income - expense,
    };
}

export async function getDailyTransactionStats(userId: number, year: number, month: number): Promise<Array<{ date: string; count: number; total: number }>> {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Group by date (YYYY-MM-DD)
    // SQLite: strftime('%Y-%m-%d', date / 1000, 'unixepoch') if stored as timestamp,
    // but Drizzle stores Date as ms timestamp integer usually or text depending on config.
    // Based on schema inspection earlier (not fully shown but standard Drizzle/SQLite), dates are likely integers (timestamps).
    // Let's assume standard behavior. If dates are strings, simple substring works. 
    // SAFEST CROSS-COMPATIBLE WAY in Drizzle+SQLite usually involves sql snippets.

    const entries = await db.select({
        date: transactions.date,
        amount: transactions.amount,
        type: transactions.type
    })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
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

export async function getCategoryStats(userId: number, year: number, month: number): Promise<Array<{
    categoryId: number;
    categoryName: string;
    color: string;
    total: number;
}>> {
    const db = getDb();

    // Optimized: Use SQL aggregation and filtering
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Use SQL GROUP BY for efficient aggregation
    const results = await db.select({
        categoryId: categories.id,
        categoryName: categories.name,
        color: categories.color,
        total: sql<number>`SUM(${transactions.amount})`,
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
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

// Budgets
export async function getBudgets(userId: number, month: number, year: number): Promise<Array<Budget & { category: Category; spent: number }>> {
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
    const result = budgetsWithCategories.map((item) => ({
        ...item.budget,
        category: item.category,
        spent: spentMap.get(item.budget.categoryId) || 0,
    }));

    return result;
}

// Budgets - Additional CRUD operations
export async function createBudget(userId: number, data: {
    categoryId: number;
    amount: number;
    month: number;
    year: number;
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

// Goals - Full CRUD operations
export async function getGoals(userId: number): Promise<Goal[]> {
    const db = getDb();
    return db.select().from(goals).where(eq(goals.userId, userId)).all();
}

export async function getGoalById(userId: number, id: number): Promise<Goal | undefined> {
    const db = getDb();
    return db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).get();
}

export async function createGoal(userId: number, data: {
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
        userId,
        currentAmount: data.currentAmount || 0,
        icon: data.icon || "Target",
        color: data.color || "#3b82f6",
    }).returning().get();
}

export async function updateGoal(userId: number, id: number, data: Partial<Goal>): Promise<Goal | undefined> {
    const db = getDb();
    return db.update(goals)
        .set(data)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning()
        .get();
}

export async function updateGoalProgress(userId: number, id: number, amount: number): Promise<Goal | undefined> {
    const db = getDb();
    const goal = await getGoalById(userId, id);
    if (!goal) return undefined;

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);

    return db.update(goals)
        .set({ currentAmount: newAmount })
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning()
        .get();
}

export async function removeGoal(userId: number, id: number): Promise<Goal | undefined> {
    const db = getDb();

    await db.update(userSettings)
        .set({ primaryGoalId: null })
        .where(and(eq(userSettings.primaryGoalId, id), eq(userSettings.userId, userId)));

    return db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).returning().get();
}

export async function getRecentTransactionsByCategory(userId: number, categoryId: number, limit: number = 5): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(and(
            eq(transactions.categoryId, categoryId),
            eq(transactions.userId, userId)
        ))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .all();
}

/**
 * Find a transaction that matches the amount but has opposite type
 * within a specific time window (default 5 minutes).
 */
export async function findRecentMatchingTransaction(
    userId: number,
    amount: number,
    type: "expense" | "income",
    windowMs: number = 300000 // 5 minutes
): Promise<Transaction | undefined> {
    const db = getDb();
    const oppositeType = type === "expense" ? "income" : "expense";
    const now = new Date();
    const startTime = new Date(now.getTime() - windowMs);

    return db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, oppositeType),
            eq(transactions.amount, amount),
            gte(transactions.date, startTime)
        ))
        .orderBy(desc(transactions.date))
        .get();
}

// Users
export async function upsertUser(data: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    whatsappId?: string;
}): Promise<User> {
    const db = getDb();

    // Check if user exists by Telegram ID
    const existing = db.select().from(users).where(eq(users.telegramId, data.telegramId)).get();

    if (existing) {
        return db.update(users)
            .set({
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                whatsappId: data.whatsappId,
            })
            .where(eq(users.id, existing.id))
            .returning()
            .get();
    } else {
        return db.insert(users).values({
            telegramId: data.telegramId,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            whatsappId: data.whatsappId,
        }).returning().get();
    }
}

export async function getAllUsers(): Promise<User[]> {
    const db = getDb();
    return db.select().from(users).all();
}

export async function getUserByTelegramId(telegramId: number): Promise<User | undefined> {
    const db = getDb();
    return db.select().from(users).where(eq(users.telegramId, telegramId)).get();
}

export async function getUserById(id: number): Promise<User | undefined> {
    const db = getDb();
    return db.select().from(users).where(eq(users.id, id)).get();
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const db = getDb();
    return db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning()
        .get();
}

export async function linkTelegramAccount(userId: number, telegramId: number): Promise<{ success: boolean; message: string }> {
    const db = getDb();
    console.log("linkTelegramAccount called:", { userId, telegramId });

    // Check if telegramId is already used
    const existingUser = await db.select().from(users).where(eq(users.telegramId, telegramId)).get();

    if (existingUser) {
        if (existingUser.id === userId) {
            return { success: true, message: "Akun sudah terhubung." };
        }

        if (existingUser.email || existingUser.password) {
            return { success: false, message: "ID Telegram ini sudah digunakan oleh akun lain yang terdaftar." };
        }

        console.log("Merging ghost user:", existingUser.id, "into real user:", userId);

        // Migrate all related data from ghost user to real user
        // Tables to migrate: transactions, budgets, goals, bills, investments, debts, scheduledMessages, merchantMappings, userSettings

        console.log("Merging ghost user:", existingUser.id, "into real user:", userId);

        // Migrate all related data from ghost user to real user
        // Tables to migrate: transactions, budgets, goals, bills, investments, debts, scheduledMessages, merchantMappings, userSettings

        // better-sqlite3 transactions are synchronous, but we can just run these sequentially for now to avoid complexity with async/sync mismatch
        // db.transaction is usually better, but if it complains about promise return, let's just do it directly.

        await db.update(transactions).set({ userId: userId }).where(eq(transactions.userId, existingUser.id));
        await db.update(budgets).set({ userId: userId }).where(eq(budgets.userId, existingUser.id));
        await db.update(goals).set({ userId: userId }).where(eq(goals.userId, existingUser.id));
        await db.update(bills).set({ userId: userId }).where(eq(bills.userId, existingUser.id));
        await db.update(investments).set({ userId: userId }).where(eq(investments.userId, existingUser.id));
        await db.update(debts).set({ userId: userId }).where(eq(debts.userId, existingUser.id));
        await db.update(scheduledMessages).set({ userId: userId }).where(eq(scheduledMessages.userId, existingUser.id));
        await db.update(merchantMappings).set({ userId: userId }).where(eq(merchantMappings.userId, existingUser.id));

        // Delete ghost user settings (collision likely, just delete ghost's settings)
        await db.delete(userSettings).where(eq(userSettings.userId, existingUser.id));

        // Finally, delete the ghost user
        await db.delete(users).where(eq(users.id, existingUser.id));

        console.log("Migration complete.");
    }

    // Update current user
    console.log("Updating target user:", userId, "with Telegram ID:", telegramId);
    await db.update(users)
        .set({ telegramId: telegramId })
        .where(eq(users.id, userId));

    return { success: true, message: "Berhasil menghubungkan akun Telegram." };
}

export async function unlinkTelegramAccount(userId: number): Promise<void> {
    const db = getDb();
    await db.update(users)
        .set({ telegramId: null })
        .where(eq(users.id, userId));
}

// User Settings
export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const db = getDb();
    let settings = db.select().from(userSettings).where(eq(userSettings.userId, userId)).get();
    return settings; // Return settings or undefined if not found
}

export async function updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings> {
    const db = getDb();
    // Ensure exists
    await getUserSettings(userId);

    return db.update(userSettings)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning()
        .get();
}

// Advanced Features
export async function analyzeSubscriptions(userId: number, monthsBack = 3): Promise<Array<{ merchant: string, amount: number, frequency: number, lastDate: Date }>> {
    const db = getDb();
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - monthsBack);

    // Get all expenses in window for user
    const expenses = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            eq(transactions.userId, userId)
        ))
        .orderBy(desc(transactions.date))
        .all();

    // Group by Merchant
    const groups: Record<string, Transaction[]> = {};
    expenses.forEach(t => {
        if (!t.merchantName) return;
        const key = t.merchantName.toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    const potentialSubs = [];

    for (const [merchant, trans] of Object.entries(groups)) {
        if (trans.length < 2) continue;

        // Check if amounts are consistent (variance < 5%)
        const amounts = trans.map(t => t.amount);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const isConsistent = amounts.every(a => Math.abs(a - avg) / avg < 0.05);

        if (isConsistent) {
            // Check intervals (roughly monthly, e.g., 25-35 days)
            // simplified: if count >= monthsBack - 1, likely recurring
            if (trans.length >= monthsBack - 1) {
                potentialSubs.push({
                    merchant: trans[0].merchantName!,
                    amount: avg,
                    frequency: trans.length,
                    lastDate: trans[0].date
                });
            }
        }
    }

    return potentialSubs;
}

// Debts / Create Split Bill
export async function createDebt(data: {
    userId: number;
    debtorName: string;
    amount: number;
    description: string;
    dueDate?: Date;
}): Promise<Debt> {
    const db = getDb();
    return db.insert(debts).values(data).returning().get();
}

export async function getDebts(userId: number, status: "paid" | "unpaid" = "unpaid"): Promise<Debt[]> {
    const db = getDb();
    return db.select()
        .from(debts)
        .where(and(
            eq(debts.userId, userId),
            eq(debts.status, status)
        ))
        .orderBy(desc(debts.createdAt))
        .all();
}

export async function updateDebtStatus(userId: number, id: number, status: "paid" | "unpaid"): Promise<Debt | undefined> {
    const db = getDb();
    return db.update(debts)
        .set({ status })
        .where(and(eq(debts.id, id), eq(debts.userId, userId)))
        .returning()
        .get();
}

// Scheduled Messages (Stock Opname etc)
export async function createScheduledMessage(data: {
    userId: number;
    message: string;
    scheduledAt: Date;
    type?: "stock_opname" | "reminder" | "other"
}): Promise<ScheduledMessage> {
    const db = getDb();
    return db.insert(scheduledMessages).values({
        ...data,
        status: "pending",
        type: data.type || "other"
    }).returning().get();
}

export async function getPendingScheduledMessages(): Promise<ScheduledMessage[]> {
    // This might be a system level usage, but mostly should be fine to check all
    // Or we filter by user if specific user asks?
    // Usually a cron job runs this.
    const db = getDb();
    const now = new Date();
    return db.select()
        .from(scheduledMessages)
        .where(and(
            eq(scheduledMessages.status, "pending"),
            lte(scheduledMessages.scheduledAt, now)
        ))
        .all();
}

export async function markScheduledMessageSent(id: number): Promise<void> {
    const db = getDb();
    await db.update(scheduledMessages)
        .set({ status: "sent" })
        .where(eq(scheduledMessages.id, id));
}

export async function getAnalysisData(userId: number, year: number, month: number) {
    const db = getDb();

    // Optimized: Use SQL filtering instead of fetching all and filtering in JS
    const allCategories = await db.select().from(categories).all();
    const stats = await getMonthlyStats(userId, year, month);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Optimized: Fetch only monthly transactions with SQL filtering
    const monthlyTransactions = await db.select({
        transaction: transactions,
        category: categories,
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(
            eq(transactions.userId, userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
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
    const expenseBreakdown: Record<string, { amount: number; color: string; icon: string }> = {};
    const incomeBreakdown: Record<string, { amount: number; color: string; icon: string }> = {};

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
                expenseBreakdown[cat.name] = { amount: 0, color: cat.color, icon: cat.icon };
            }
            expenseBreakdown[cat.name].amount += t.amount;
        } else if (t.type === 'income') {
            if (!incomeBreakdown[cat.name]) {
                incomeBreakdown[cat.name] = { amount: 0, color: cat.color, icon: cat.icon };
            }
            incomeBreakdown[cat.name].amount += t.amount;
        }
    });

    // Savings Rule category includes actual investment expenses + unused balance
    // Unused balance is allocated to savings in this logic?
    // If balance is positive, we assume it's saved.
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

// ============ Bills CRUD ============

export async function getBills(userId: number): Promise<Bill[]> {
    const db = getDb();
    return db.select().from(bills).where(eq(bills.userId, userId)).orderBy(bills.dueDate).all();
}

export async function getBillById(userId: number, id: number): Promise<Bill | undefined> {
    const db = getDb();
    return db.select().from(bills).where(and(eq(bills.id, id), eq(bills.userId, userId))).get();
}

export async function createBill(userId: number, data: {
    name: string;
    amount: number;
    categoryId?: number;
    dueDate?: number;
    frequency?: "monthly" | "weekly" | "yearly";
    icon?: string;
    color?: string;
    notes?: string;
}): Promise<Bill> {
    const db = getDb();
    const result = await db.insert(bills).values({
        userId,
        name: data.name,
        amount: data.amount,
        categoryId: data.categoryId || null,
        dueDate: data.dueDate || 1,
        frequency: data.frequency || "monthly",
        icon: data.icon || "Receipt",
        color: data.color || "#6366f1",
        notes: data.notes || null,
    }).returning();
    return result[0];
}

export async function updateBill(userId: number, id: number, data: Partial<Bill>): Promise<Bill | undefined> {
    const db = getDb();
    const result = await db.update(bills)
        .set(data)
        .where(and(eq(bills.id, id), eq(bills.userId, userId)))
        .returning();
    return result[0];
}

export async function deleteBill(userId: number, id: number): Promise<void> {
    const db = getDb();
    await db.delete(bills).where(and(eq(bills.id, id), eq(bills.userId, userId)));
}

export async function toggleBillPaid(userId: number, id: number): Promise<Bill | undefined> {
    const db = getDb();
    const bill = await getBillById(userId, id);
    if (!bill) return undefined;

    const newPaid = !bill.isPaid;
    const result = await db.update(bills)
        .set({
            isPaid: newPaid,
            lastPaidAt: newPaid ? new Date() : null,
        })
        .where(and(eq(bills.id, id), eq(bills.userId, userId)))
        .returning();
    return result[0];
}

export async function ensureSampleBills(userId: number): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(bills).where(eq(bills.userId, userId)).all();
    if (existing.length > 0) return;

    const allCats = await db.select().from(categories).all();
    const getCatId = (name: string) => allCats.find(c => c.name === name)?.id || null;

    await db.insert(bills).values([
        { userId, name: "Listrik PLN", amount: 350000, categoryId: getCatId("Tagihan"), dueDate: 20, icon: "Zap", color: "#f59e0b" },
        { userId, name: "WiFi Indihome", amount: 399000, categoryId: getCatId("Tagihan"), dueDate: 15, icon: "Wifi", color: "#3b82f6" },
        { userId, name: "Netflix", amount: 54000, categoryId: getCatId("Hiburan"), dueDate: 5, icon: "Tv", color: "#ef4444" },
    ]);
}

// ============ Investments CRUD ============

// Helper to get total assets
export async function getAssetsValue(userId: number): Promise<{ totalGoals: number, totalInvestments: number }> {
    const goalsList = await getGoals(userId);
    const totalGoals = goalsList.reduce((acc, g) => acc + g.currentAmount, 0);

    const investmentsList = await getInvestments(userId);
    const totalInvestments = investmentsList.reduce((acc, i) => acc + (i.quantity * i.currentPrice), 0);

    return {
        totalGoals,
        totalInvestments
    };
}

export async function getInvestments(userId: number): Promise<Investment[]> {
    const db = getDb();
    return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt)).all();
}

export async function getInvestmentById(userId: number, id: number): Promise<Investment | undefined> {
    const db = getDb();
    return db.select().from(investments).where(and(eq(investments.id, id), eq(investments.userId, userId))).get();
}

export async function createInvestment(userId: number, data: {
    name: string;
    type: "stock" | "crypto" | "mutual_fund" | "gold" | "bond" | "other";
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    platform?: string;
    icon?: string;
    color?: string;
    notes?: string;
}): Promise<Investment> {
    const db = getDb();
    const result = await db.insert(investments).values({
        userId,
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        avgBuyPrice: data.avgBuyPrice,
        currentPrice: data.currentPrice,
        platform: data.platform || null,
        icon: data.icon || "TrendingUp",
        color: data.color || "#10b981",
        notes: data.notes || null,
    }).returning();
    return result[0];
}

export async function updateInvestment(userId: number, id: number, data: Partial<Investment>): Promise<Investment | undefined> {
    const db = getDb();
    const result = await db.update(investments)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(eq(investments.id, id), eq(investments.userId, userId)))
        .returning();
    return result[0];
}

export async function deleteInvestment(userId: number, id: number): Promise<void> {
    const db = getDb();
    await db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

export async function ensureSampleInvestments(userId: number): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(investments).where(eq(investments.userId, userId)).all();
    if (existing.length > 0) return;

    await db.insert(investments).values([
        { userId, name: "BBCA", type: "stock", quantity: 500, avgBuyPrice: 9200, currentPrice: 10500, platform: "Ajaib", icon: "BarChart", color: "#3b82f6" },
        { userId, name: "Emas Antam", type: "gold", quantity: 5, avgBuyPrice: 1100000, currentPrice: 1350000, platform: "Pegadaian", icon: "Award", color: "#eab308" },
    ]);
}

export async function getFinancialHealthMetrics(userId: number) {
    const db = getDb();
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

// Chat History
export async function getChatHistory(userId: number, limit = 25): Promise<ChatHistory[]> {
    const db = getDb();
    const history = await db.select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, userId))
        .orderBy(desc(chatHistory.createdAt))
        .limit(limit)
        .all();

    return history.reverse(); // Return in chronological order
}

export async function addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<ChatHistory> {
    const db = getDb();
    return db.insert(chatHistory).values({
        userId,
        role,
        content
    }).returning().get();
}

const ADMIN_FEE_PERCENTAGE = 0.02; // 2% admin fee

export async function transferToGoal(userId: number, goalId: number, amount: number, description?: string): Promise<Transaction | undefined> {
    const db = getDb();

    const goal = await getGoalById(userId, goalId);
    if (!goal) return undefined;

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const netAmount = amount - fee;
    const newAmount = Math.min(goal.currentAmount + netAmount, goal.targetAmount);

    await db.update(goals)
        .set({ currentAmount: newAmount })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

    const cats = db.select().from(categories).all();
    const tabunganCat = cats.find((c: Category) => c.name === "Tabungan");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Transfer ke ${goal.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "transfer",
        categoryId: tabunganCat?.id,
        destinationType: "goal",
        destinationId: goalId,
        paymentMethod: "saldo_aktif",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    return transaction;
}

export async function transferToInvestment(userId: number, investmentId: number, amount: number, description?: string): Promise<Transaction | undefined> {
    const db = getDb();

    const investment = await getInvestmentById(userId, investmentId);
    if (!investment) return undefined;

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const netAmount = amount - fee;
    const newQuantity = investment.quantity + (netAmount / investment.avgBuyPrice);

    await db.update(investments)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)));

    const cats = db.select().from(categories).all();
    const investasiCat = cats.find((c: Category) => c.name === "Investasi");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Buy ${investment.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "transfer",
        categoryId: investasiCat?.id,
        destinationType: "investment",
        destinationId: investmentId,
        paymentMethod: "saldo_aktif",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    return transaction;
}

export async function payBill(userId: number, billId: number, amount: number, description?: string): Promise<Transaction | undefined> {
    const db = getDb();

    const bill = await getBillById(userId, billId);
    if (!bill) return undefined;

    await db.update(bills)
        .set({ isPaid: true, lastPaidAt: new Date() })
        .where(and(eq(bills.id, billId), eq(bills.userId, userId)));

    const cats = db.select().from(categories).all();
    const tagihanCat = cats.find((c: Category) => c.name === "Tagihan");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Bayar ${bill.name}`,
        type: "expense",
        categoryId: tagihanCat?.id,
        destinationType: "bill",
        destinationId: billId,
        paymentMethod: "saldo_aktif",
        date: new Date(),
        isVerified: true,
    }).returning().get();
    return transaction;
}

// ============ Advanced Analytics Functions ============

export async function getMonthlyComparison(userId: number, months: number = 6) {
    const db = getDb();
    const now = new Date();
    const comparisons = [];

    for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const stats = await getMonthlyStats(userId, date.getFullYear(), date.getMonth() + 1);
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

export async function getTopSpendingCategories(userId: number, year: number, month: number, limit: number = 5) {
    const db = getDb();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

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
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .groupBy(transactions.categoryId)
        .orderBy(sql`totalAmount DESC`)
        .limit(limit)
        .all();

    // Get previous month for trend comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    const prevResults = await db.select({
        categoryId: transactions.categoryId,
        totalAmount: sql<number>`SUM(${transactions.amount})`.as('totalAmount')
    })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, prevStartDate),
            lte(transactions.date, prevEndDate)
        ))
        .groupBy(transactions.categoryId)
        .all();

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

export async function getSpendingPatterns(userId: number, year: number, month: number) {
    const db = getDb();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Daily spending for heatmap
    const dailySpending = await db.select({
        date: sql<string>`strftime('%Y-%m-%d', ${transactions.date} / 1000, 'unixepoch')`.as('date'),
        dayOfWeek: sql<number>`CAST(strftime('%w', ${transactions.date} / 1000, 'unixepoch') AS INTEGER)`.as('dayOfWeek'),
        dayOfMonth: sql<number>`CAST(strftime('%d', ${transactions.date} / 1000, 'unixepoch') AS INTEGER)`.as('dayOfMonth'),
        totalAmount: sql<number>`SUM(${transactions.amount})`.as('totalAmount'),
        transactionCount: sql<number>`COUNT(*)`.as('transactionCount')
    })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
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

    // Detect anomalies (days with spending > 2x average)
    const anomalies = dailySpending.filter(day => day.totalAmount > avgDaily * 2);

    return {
        dailySpending,
        highestSpendingDay: maxSpending,
        averageDailySpending: avgDaily,
        anomalies,
        totalSpendingDays: dailySpending.length
    };
}

export async function getGoalsProgress(userId: number) {
    const db = getDb();
    const goalsList = await getGoals(userId);

    const now = new Date();

    return goalsList.map(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        let estimatedDays = null;

        if (goal.deadline && progress < 100) {
            const deadline = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

export async function calculateFinancialHealthScore(userId: number) {
    const db = getDb();
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
    let scores = {
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
        recommendations: generateRecommendations(scores, avgIncome, avgExpense)
    };
}

function generateRecommendations(scores: any, avgIncome: number, avgExpense: number) {
    const recommendations = [];

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

export async function getCashflowPrediction(userId: number) {
    const db = getDb();
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


export async function withdrawFromGoal(userId: number, goalId: number, amount: number, description?: string): Promise<Transaction | undefined> {
    const db = getDb();

    const goal = await getGoalById(userId, goalId);
    if (!goal) return undefined;

    // Check if goal has enough balance
    if (goal.currentAmount < amount) {
        throw new Error("Insufficient goal balance");
    }

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const newAmount = goal.currentAmount - amount;

    await db.update(goals)
        .set({ currentAmount: newAmount })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

    const cats = db.select().from(categories).all();
    const tabunganCat = cats.find((c: Category) => c.name === "Tabungan");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Withdraw dari ${goal.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "withdraw",
        categoryId: tabunganCat?.id,
        sourceType: "goal",
        sourceId: goalId,
        paymentMethod: "saldo_aktif",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    return transaction;
}

export async function withdrawFromInvestment(userId: number, investmentId: number, amount: number, description?: string): Promise<Transaction | undefined> {
    const db = getDb();

    const investment = await getInvestmentById(userId, investmentId);
    if (!investment) return undefined;

    // Calculate max withdrawable amount based on current value
    const currentValue = investment.quantity * investment.currentPrice;
    if (currentValue < amount) {
        throw new Error("Insufficient investment value");
    }

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const sellQuantity = amount / investment.currentPrice;
    const newQuantity = investment.quantity - sellQuantity;

    await db.update(investments)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)));

    const cats = db.select().from(categories).all();
    const investasiCat = cats.find((c: Category) => c.name === "Investasi");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Sell ${investment.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "withdraw",
        categoryId: investasiCat?.id,
        sourceType: "investment",
        sourceId: investmentId,
        paymentMethod: "saldo_aktif",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    return transaction;
}

export async function getTotalInvestmentsValue(userId: number): Promise<number> {
    const db = getDb();
    const result = await db
        .select({ total: sql<number>`SUM(${investments.quantity} * ${investments.currentPrice})` })
        .from(investments)
        .where(eq(investments.userId, userId))
        .get();
    return result?.total || 0;
}

// ============ AI Chat History & Limits ============

export async function logAIChat(userId: number, role: "user" | "assistant", content: string): Promise<ChatHistory> {
    const db = getDb();
    return db.insert(chatHistory).values({
        userId,
        role,
        content,
    }).returning().get();
}

export async function getDailyAICount(userId: number): Promise<number> {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = db.select({ count: sql<number>`COUNT(*)` })
        .from(chatHistory)
        .where(and(
            eq(chatHistory.userId, userId),
            eq(chatHistory.role, "user"), // Count user messages as "usages"
            gte(chatHistory.createdAt, today)
        ))
        .get();

    return result?.count || 0;
}

// ============ Coupons & Upgrades ============

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
    const db = getDb();
    return db.select().from(coupons).where(eq(coupons.code, code)).get();
}

export async function useCoupon(couponId: number, userId: number, tier: "kaya" | "sultan"): Promise<void> {
    const db = getDb();

    // Mark coupon as used
    db.update(coupons)
        .set({
            isUsed: true,
            usedBy: userId,
            usedAt: new Date()
        })
        .where(eq(coupons.id, couponId))
        .run();

    // Upgrade user tier
    db.update(users)
        .set({ tier: tier })
        .where(eq(users.id, userId))
        .run();
}

