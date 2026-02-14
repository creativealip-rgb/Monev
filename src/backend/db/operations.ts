import { getDb } from "./index";
import { transactions, categories, budgets, goals, userSettings, users, debts, scheduledMessages, bills, investments } from "./schema";
import type { Transaction, Category, Budget, Goal, UserSettings, User, Debt, ScheduledMessage, Bill, Investment } from "./schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { calculateRunway, calculateIdleCash } from "@/lib/financial-advising";

// Re-export types
export type { Transaction, Category, Budget, Goal, UserSettings, User, Debt, Bill, Investment };

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

export async function removeGoal(id: number): Promise<Goal | undefined> {
    const db = getDb();

    // Check if this goal is set as primaryGoalId in userSettings
    await db.update(userSettings)
        .set({ primaryGoalId: null })
        .where(eq(userSettings.primaryGoalId, id));

    return db.delete(goals).where(eq(goals.id, id)).returning().get();
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

// Users
export async function upsertUser(data: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    whatsappId?: string;
}): Promise<User> {
    const db = getDb();

    // Check if user exists
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

// Advanced Features
export async function analyzeSubscriptions(monthsBack = 3): Promise<Array<{ merchant: string, amount: number, frequency: number, lastDate: Date }>> {
    const db = getDb();
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - monthsBack);

    // Get all expenses in window
    const expenses = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate)
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

export async function updateDebtStatus(id: number, status: "paid" | "unpaid"): Promise<Debt | undefined> {
    const db = getDb();
    return db.update(debts)
        .set({ status })
        .where(eq(debts.id, id))
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

export async function getAnalysisData(year: number, month: number) {
    const db = getDb();

    const allCategories = await db.select().from(categories).all();
    const stats = await getMonthlyStats(year, month);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const allTransactions = await db.select().from(transactions).all();
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

export async function getBills(): Promise<Bill[]> {
    const db = getDb();
    return db.select().from(bills).orderBy(bills.dueDate).all();
}

export async function getBillById(id: number): Promise<Bill | undefined> {
    const db = getDb();
    return db.select().from(bills).where(eq(bills.id, id)).get();
}

export async function createBill(data: {
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

export async function updateBill(id: number, data: Partial<Bill>): Promise<Bill | undefined> {
    const db = getDb();
    const result = await db.update(bills)
        .set(data)
        .where(eq(bills.id, id))
        .returning();
    return result[0];
}

export async function deleteBill(id: number): Promise<void> {
    const db = getDb();
    await db.delete(bills).where(eq(bills.id, id));
}

export async function toggleBillPaid(id: number): Promise<Bill | undefined> {
    const db = getDb();
    const bill = await getBillById(id);
    if (!bill) return undefined;

    const newPaid = !bill.isPaid;
    const result = await db.update(bills)
        .set({
            isPaid: newPaid,
            lastPaidAt: newPaid ? new Date() : null,
        })
        .where(eq(bills.id, id))
        .returning();
    return result[0];
}

export async function ensureSampleBills(): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(bills).all();
    if (existing.length > 0) return;

    const allCats = await db.select().from(categories).all();
    const getCatId = (name: string) => allCats.find(c => c.name === name)?.id || null;

    await db.insert(bills).values([
        { name: "Listrik PLN", amount: 350000, categoryId: getCatId("Tagihan"), dueDate: 20, icon: "Zap", color: "#f59e0b" },
        { name: "WiFi Indihome", amount: 399000, categoryId: getCatId("Tagihan"), dueDate: 15, icon: "Wifi", color: "#3b82f6" },
        { name: "Netflix", amount: 54000, categoryId: getCatId("Hiburan"), dueDate: 5, icon: "Tv", color: "#ef4444" },
        { name: "Spotify", amount: 54990, categoryId: getCatId("Hiburan"), dueDate: 12, icon: "Music", color: "#22c55e" },
        { name: "BPJS Kesehatan", amount: 150000, categoryId: getCatId("Kesehatan"), dueDate: 10, icon: "Heart", color: "#ec4899" },
        { name: "Cicilan Motor", amount: 850000, categoryId: getCatId("Transportasi"), dueDate: 25, icon: "Bike", color: "#8b5cf6" },
    ]);
}

// ============ Investments CRUD ============

export async function getInvestments(): Promise<Investment[]> {
    const db = getDb();
    return db.select().from(investments).orderBy(desc(investments.createdAt)).all();
}

export async function getInvestmentById(id: number): Promise<Investment | undefined> {
    const db = getDb();
    return db.select().from(investments).where(eq(investments.id, id)).get();
}

export async function createInvestment(data: {
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

export async function updateInvestment(id: number, data: Partial<Investment>): Promise<Investment | undefined> {
    const db = getDb();
    const result = await db.update(investments)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(investments.id, id))
        .returning();
    return result[0];
}

export async function deleteInvestment(id: number): Promise<void> {
    const db = getDb();
    await db.delete(investments).where(eq(investments.id, id));
}

export async function ensureSampleInvestments(): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(investments).all();
    if (existing.length > 0) return;

    await db.insert(investments).values([
        { name: "BBCA", type: "stock", quantity: 500, avgBuyPrice: 9200, currentPrice: 10500, platform: "Ajaib", icon: "BarChart", color: "#3b82f6" },
        { name: "Bitcoin", type: "crypto", quantity: 0.005, avgBuyPrice: 950000000, currentPrice: 1530000000, platform: "Pintu", icon: "Bitcoin", color: "#f59e0b" },
        { name: "Emas Antam", type: "gold", quantity: 5, avgBuyPrice: 1100000, currentPrice: 1350000, platform: "Pegadaian", icon: "Award", color: "#eab308" },
        { name: "Reksadana Sucor", type: "mutual_fund", quantity: 1500, avgBuyPrice: 1000, currentPrice: 1250, platform: "Bibit", icon: "PieChart", color: "#8b5cf6" },
    ]);
}


export async function getFinancialHealthMetrics() {
    const db = getDb();
    const now = new Date();

    // Calculate Average Monthly Expense (Last 3 Months)
    let totalExpenseLast3Months = 0;
    for (let i = 1; i <= 3; i++) {
        // handle month wrap
        let d = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        // Actually simpler: just get all transactions from 3 months ago until now
        // But reusing getMonthlyStats is safer for consistency if logic changes
    }

    // Simpler approach for avg expense:
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 2); // Current + 2 prev months
    threeMonthsAgo.setDate(1);

    const recentTrans = await db.select().from(transactions).where(gte(transactions.date, threeMonthsAgo)).all();

    // Group by month to handle averages correctly? 
    // Or just simple total / 3? Simple total / 3 is roughly ok for "Runway" estimation.
    // Better: sum of expenses in recentTrans / 3.
    const recentExpenses = recentTrans
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const avgMonthlyExpense = recentExpenses / 3;

    // Calculate Total Balance (All time)
    const allTrans = await db.select().from(transactions).all();
    const totalIncome = allTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalMonev = allTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = totalIncome - totalMonev;

    const runway = calculateRunway(currentBalance, avgMonthlyExpense);
    const idleCash = calculateIdleCash(currentBalance, avgMonthlyExpense);

    return {
        currentBalance,
        avgMonthlyExpense,
        runway,
        idleCash
    };
}
