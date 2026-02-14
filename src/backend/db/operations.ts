import { getDb } from "./index";
import { transactions, categories, budgets, goals, userSettings, users, debts, scheduledMessages, bills, investments, merchantMappings } from "./schema";
import type { Transaction, Category, Budget, Goal, UserSettings, User, Debt, ScheduledMessage, Bill, Investment } from "./schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { calculateRunway, calculateIdleCash } from "@/lib/financial-advising";

// Re-export types
export type { Transaction, Category, Budget, Goal, UserSettings, User, Debt, Bill, Investment };

// Categories (Global for now)
export async function getCategories(): Promise<Category[]> {
    const db = getDb();
    return db.select().from(categories).all();
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
    const db = getDb();
    return db.select().from(categories).where(eq(categories.id, id)).get();
}

// Transactions
export async function getTransactions(userId: number, limit = 50): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .all();
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
    type: "expense" | "income";
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

    // Get all transactions for user
    const allTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId)).all();

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

export async function getCategoryStats(userId: number, year: number, month: number): Promise<Array<{
    categoryId: number;
    categoryName: string;
    color: string;
    total: number;
}>> {
    const db = getDb();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all transactions and categories for user
    const allTransactions = await db.select({
        transaction: transactions,
        category: categories,
    })
        .from(transactions)
        .innerJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense")
        ))
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
async function ensureSampleBudgets(userId: number, month: number, year: number) {
    const db = getDb();

    const existingBudgets = await db.select()
        .from(budgets)
        .where(and(
            eq(budgets.userId, userId),
            eq(budgets.month, month),
            eq(budgets.year, year)
        ))
        .all();

    if (existingBudgets.length >= 3) return;

    const allCategories = await db.select().from(categories).all();
    const getCatId = (name: string) => allCategories.find(c => c.name === name)?.id;

    const sampleBudgets = [
        { userId, categoryId: getCatId("Makan & Minuman")!, amount: 2500000, month, year },
        { userId, categoryId: getCatId("Transportasi")!, amount: 1000000, month, year },
        { userId, categoryId: getCatId("Hiburan")!, amount: 800000, month, year },
    ];

    for (const budget of sampleBudgets) {
        if (!budget.categoryId) continue;
        const exists = existingBudgets.some(b => b.categoryId === budget.categoryId);
        if (!exists) {
            await db.insert(budgets).values(budget);
        }
    }
}

// Budgets
export async function getBudgets(userId: number, month: number, year: number): Promise<Array<Budget & { category: Category; spent: number }>> {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Ensure sample budgets exist for current month
    await ensureSampleBudgets(userId, month, year);

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

    // Get all transactions for the month for user
    const allTransactions = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense")
        ))
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

// Ensure sample goals exist
async function ensureSampleGoals(userId: number) {
    const db = getDb();

    const existingGoals = await db.select().from(goals).where(eq(goals.userId, userId)).all();
    if (existingGoals.length >= 1) return; // Reduce sample spam

    const sampleGoals = [
        { userId, name: "Dana Darurat", targetAmount: 10000000, currentAmount: 2000000, deadline: new Date("2026-12-31"), icon: "🛡️", color: "#22c55e" },
    ];

    for (const goal of sampleGoals) {
        await db.insert(goals).values(goal);
    }
}

// Goals - Full CRUD operations
export async function getGoals(userId: number): Promise<Goal[]> {
    await ensureSampleGoals(userId);
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

    // Check if this goal is set as primaryGoalId in userSettings
    // Need to strictly user scope this too
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
export async function getUserSettings(userId: number): Promise<UserSettings> {
    const db = getDb();
    let settings = db.select().from(userSettings).where(eq(userSettings.userId, userId)).get();

    if (!settings) {
        // Create default settings if not exists
        settings = db.insert(userSettings).values({
            userId,
            hourlyRate: 50000,
        }).returning().get();
    }

    return settings;
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

    const allCategories = await db.select().from(categories).all();
    const stats = await getMonthlyStats(userId, year, month);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const allTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId)).all();
    const monthlyTransactions = allTransactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate >= startDate && transDate <= endDate;
    });

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

    monthlyTransactions.forEach(t => {
        const cat = allCategories.find(c => c.id === t.categoryId);
        if (!cat) return;

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
