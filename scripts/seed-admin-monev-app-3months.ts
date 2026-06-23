import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../src/backend/db";
import {
    accounts,
    achievements,
    userAchievements,
    billPayments,
    bills,
    budgets,
    categories,
    debts,
    goals,
    investments,
    transactions,
    userSettings,
    users,
} from "../src/backend/db/schema";

const TARGET_EMAIL = "admin@monev.app";

const GLOBAL_CATEGORIES = [
    { name: "Makan & Minuman", color: "#f97316", icon: "Utensils", type: "expense" as const },
    { name: "Transportasi", color: "#3b82f6", icon: "Car", type: "expense" as const },
    { name: "Hiburan", color: "#a855f7", icon: "Gamepad2", type: "expense" as const },
    { name: "Belanja", color: "#ec4899", icon: "ShoppingBag", type: "expense" as const },
    { name: "Kesehatan", color: "#22c55e", icon: "Heart", type: "expense" as const },
    { name: "Tagihan", color: "#ef4444", icon: "Receipt", type: "expense" as const },
    { name: "Investasi", color: "#10b981", icon: "TrendingUp", type: "expense" as const },
    { name: "Tabungan", color: "#0ea5e9", icon: "PiggyBank", type: "expense" as const },
    { name: "Gaji", color: "#16a34a", icon: "Banknote", type: "income" as const },
    { name: "Freelance", color: "#8b5cf6", icon: "Briefcase", type: "income" as const },
    { name: "Lainnya", color: "#64748b", icon: "MoreHorizontal", type: "expense" as const },
];

function monthInfo(offsetFromCurrent: number) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() + offsetFromCurrent, 1);
    return {
        year: firstDay.getFullYear(),
        month: firstDay.getMonth() + 1,
    };
}

function dateAt(year: number, month: number, day: number, hour = 9, minute = 0) {
    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

async function ensureCategories() {
    const db = getDb();
    const existing = await db.select().from(categories).all();

    for (const category of GLOBAL_CATEGORIES) {
        const found = existing.find(
            (item) =>
                item.userId === null &&
                item.name === category.name &&
                item.type === category.type
        );

        if (!found) {
            await db.insert(categories).values({
                userId: null,
                ...category,
            });
        }
    }

    return db.select().from(categories).all();
}

async function cleanupUserData(userId: number) {
    const db = getDb();

    const userBills = await db.select({ id: bills.id }).from(bills).where(eq(bills.userId, userId)).all();
    if (userBills.length > 0) {
        await db.delete(billPayments).where(inArray(billPayments.billId, userBills.map((bill) => bill.id)));
    }

    await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    await db.delete(debts).where(eq(debts.userId, userId));
    await db.delete(investments).where(eq(investments.userId, userId));
    await db.delete(bills).where(eq(bills.userId, userId));
    await db.delete(budgets).where(eq(budgets.userId, userId));
    await db.delete(goals).where(eq(goals.userId, userId));
    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
}

async function main() {
    const db = getDb();

    const user = await db.select().from(users).where(eq(users.email, TARGET_EMAIL)).get();
    if (!user) {
        throw new Error(`User ${TARGET_EMAIL} tidak ditemukan`);
    }

    const userId = user.id;
    const categoryRows = await ensureCategories();
    const getCategoryId = (name: string, type?: "expense" | "income") => {
        const row = categoryRows.find(
            (item) => item.name === name && (type ? item.type === type : true)
        );
        if (!row) {
            throw new Error(`Kategori ${name} tidak ditemukan`);
        }
        return row.id;
    };

    console.log(`🧹 Menghapus data lama untuk ${TARGET_EMAIL}...`);
    await cleanupUserData(userId);

    console.log("🏦 Membuat accounts...");
    const insertedAccounts = await db
        .insert(accounts)
        .values([
            {
                userId,
                name: "BCA",
                type: "bank",
                balance: 14250000,
                color: "#3b82f6",
                icon: "Building2",
            },
            {
                userId,
                name: "GoPay",
                type: "emoney",
                balance: 850000,
                color: "#00aed8",
                icon: "Wallet",
            },
            {
                userId,
                name: "Cash",
                type: "cash",
                balance: 1250000,
                color: "#22c55e",
                icon: "Banknote",
            },
            {
                userId,
                name: "Mandiri",
                type: "bank",
                balance: 7800000,
                color: "#f97316",
                icon: "Landmark",
            },
        ])
        .returning();

    const accountByName = Object.fromEntries(insertedAccounts.map((account) => [account.name, account.id]));

    console.log("🎯 Membuat goals...");
    const insertedGoals = await db
        .insert(goals)
        .values([
            {
                userId,
                name: "Dana Darurat 6 Bulan",
                targetAmount: 30000000,
                currentAmount: 12500000,
                deadline: dateAt(monthInfo(5).year, monthInfo(5).month, 30),
                icon: "Shield",
                color: "#22c55e",
            },
            {
                userId,
                name: "MacBook Baru",
                targetAmount: 24000000,
                currentAmount: 7800000,
                deadline: dateAt(monthInfo(4).year, monthInfo(4).month, 15),
                icon: "Laptop",
                color: "#3b82f6",
            },
            {
                userId,
                name: "Liburan ke Jepang",
                targetAmount: 45000000,
                currentAmount: 9500000,
                deadline: dateAt(monthInfo(8).year, monthInfo(8).month, 20),
                icon: "Plane",
                color: "#f97316",
            },
        ])
        .returning();

    console.log("📋 Membuat bills...");
    const insertedBills = await db
        .insert(bills)
        .values([
            {
                userId,
                name: "Listrik PLN",
                amount: 465000,
                categoryId: getCategoryId("Tagihan", "expense"),
                dueDate: 20,
                frequency: "monthly",
                icon: "Zap",
                color: "#f59e0b",
                isSubscription: false,
            },
            {
                userId,
                name: "WiFi Indihome",
                amount: 429000,
                categoryId: getCategoryId("Tagihan", "expense"),
                dueDate: 15,
                frequency: "monthly",
                icon: "Wifi",
                color: "#3b82f6",
                isSubscription: true,
            },
            {
                userId,
                name: "Netflix Premium",
                amount: 186000,
                categoryId: getCategoryId("Hiburan", "expense"),
                dueDate: 5,
                frequency: "monthly",
                icon: "Tv",
                color: "#ef4444",
                isSubscription: true,
            },
            {
                userId,
                name: "Spotify Family",
                amount: 89000,
                categoryId: getCategoryId("Hiburan", "expense"),
                dueDate: 10,
                frequency: "monthly",
                icon: "Music",
                color: "#22c55e",
                isSubscription: true,
            },
        ])
        .returning();

    console.log("📈 Membuat investments...");
    await db.insert(investments).values([
        {
            userId,
            name: "BBCA",
            type: "stock",
            quantity: 150,
            avgBuyPrice: 9200,
            currentPrice: 10150,
            platform: "Ajaib",
            icon: "BarChart3",
            color: "#3b82f6",
            totalDividends: 175000,
            realizedProfit: 0,
        },
        {
            userId,
            name: "Bitcoin",
            type: "crypto",
            quantity: 0.01,
            avgBuyPrice: 1045000000,
            currentPrice: 1130000000,
            platform: "Tokocrypto",
            icon: "Coins",
            color: "#f59e0b",
            totalDividends: 0,
            realizedProfit: 0,
        },
        {
            userId,
            name: "Reksadana Pasar Uang",
            type: "mutual_fund",
            quantity: 8500000,
            avgBuyPrice: 1,
            currentPrice: 1.04,
            platform: "Bibit",
            icon: "PieChart",
            color: "#10b981",
            totalDividends: 0,
            realizedProfit: 0,
        },
    ]);

    console.log("💸 Membuat debts...");
    await db.insert(debts).values([
        {
            userId,
            debtorName: "Budi",
            amount: 450000,
            description: "Talangin makan tim",
            dueDate: dateAt(monthInfo(0).year, monthInfo(0).month, 28),
            status: "unpaid",
        },
        {
            userId,
            debtorName: "Citra",
            amount: 1250000,
            description: "Patungan tiket konser",
            dueDate: dateAt(monthInfo(1).year, monthInfo(1).month, 18),
            status: "paid",
        },
    ]);

    console.log("⚙️ Membuat user settings...");
    await db.insert(userSettings).values({
        userId,
        hourlyRate: 95000,
        primaryGoalId: insertedGoals[0]?.id ?? null,
        hasCompletedOnboarding: true,
        notificationsEnabled: true,
        dailyReport: true,
        budgetAlert: true,
        transactionUpdate: true,
        billReminder: true,
        goalProgress: true,
        promoNews: false,
        pushEnabled: true,
        emailEnabled: true,
        telegramEnabled: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        hideBalance: false,
        isAppLockEnabled: false,
        isBiometricEnabled: false,
        autoLockTimeout: 300000,
        monthlyReportEmail: true,
        monthlyReportTelegram: false,
        weeklyInsightTelegram: false,
        reportLocale: "id",
    });

    const months = [monthInfo(-2), monthInfo(-1), monthInfo(0)];

    console.log("💰 Membuat budgets 3 bulan terakhir...");
    for (const period of months) {
        await db.insert(budgets).values([
            {
                userId,
                categoryId: getCategoryId("Makan & Minuman", "expense"),
                amount: 3200000,
                spent: 0,
                month: period.month,
                year: period.year,
            },
            {
                userId,
                categoryId: getCategoryId("Transportasi", "expense"),
                amount: 1200000,
                spent: 0,
                month: period.month,
                year: period.year,
            },
            {
                userId,
                categoryId: getCategoryId("Hiburan", "expense"),
                amount: 900000,
                spent: 0,
                month: period.month,
                year: period.year,
            },
            {
                userId,
                categoryId: getCategoryId("Belanja", "expense"),
                amount: 2500000,
                spent: 0,
                month: period.month,
                year: period.year,
            },
            {
                userId,
                categoryId: getCategoryId("Tagihan", "expense"),
                amount: 1800000,
                spent: 0,
                month: period.month,
                year: period.year,
            },
            {
                userId,
                categoryId: getCategoryId("Investasi", "expense"),
                amount: 2500000,
                spent: 0,
                month: period.month,
                year: period.year,
            },
        ]);
    }

    const [twoMonthsAgo, lastMonth, currentMonth] = months;
    const transactionRows = [
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 1, 8, 15), amount: 9200000, description: "Gaji Bulanan", merchantName: "PT Monev Nusantara", categoryId: getCategoryId("Gaji", "income"), type: "income" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 3, 12, 10), amount: 38000, description: "Makan siang ayam geprek", merchantName: "Ayam Geprek Pak Gembus", categoryId: getCategoryId("Makan & Minuman", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 4, 18, 25), amount: 185000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "gopay", accountId: accountByName.GoPay },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 5, 8, 5), amount: 89000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "gopay", accountId: accountByName.GoPay },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 6, 9, 40), amount: 125000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCategoryId("Transportasi", "expense"), type: "expense" as const, paymentMethod: "cash", accountId: accountByName.Cash },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 7, 20, 15), amount: 1450000, description: "Freelance landing page", merchantName: "Client A", categoryId: getCategoryId("Freelance", "income"), type: "income" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 10, 19, 30), amount: 785000, description: "Belanja bulanan", merchantName: "Hypermart", categoryId: getCategoryId("Belanja", "expense"), type: "expense" as const, paymentMethod: "debit", accountId: accountByName.BCA },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 12, 7, 30), amount: 429000, description: "Tagihan WiFi rumah", merchantName: "Indihome", categoryId: getCategoryId("Tagihan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 15, 21, 15), amount: 265000, description: "Nonton dan dinner", merchantName: "Cinema XXI", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 18, 10, 0), amount: 2500000, description: "Top up reksadana", merchantName: "Bibit", categoryId: getCategoryId("Investasi", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 22, 16, 45), amount: 1200000, description: "Tabungan dana darurat", merchantName: "Transfer Internal", categoryId: getCategoryId("Tabungan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 25, 13, 5), amount: 54000, description: "Kopi dan snack", merchantName: "Starbucks", categoryId: getCategoryId("Makan & Minuman", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },

        { date: dateAt(lastMonth.year, lastMonth.month, 1, 8, 10), amount: 9200000, description: "Gaji Bulanan", merchantName: "PT Monev Nusantara", categoryId: getCategoryId("Gaji", "income"), type: "income" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(lastMonth.year, lastMonth.month, 2, 19, 10), amount: 1500000, description: "Bayar kos bulanan", merchantName: "Ibu Kos", categoryId: getCategoryId("Tagihan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },
        { date: dateAt(lastMonth.year, lastMonth.month, 4, 12, 20), amount: 42000, description: "Makan siang rawon", merchantName: "Depot Rawon Setan", categoryId: getCategoryId("Makan & Minuman", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(lastMonth.year, lastMonth.month, 5, 8, 0), amount: 186000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "gopay", accountId: accountByName.GoPay },
        { date: dateAt(lastMonth.year, lastMonth.month, 6, 8, 5), amount: 89000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "gopay", accountId: accountByName.GoPay },
        { date: dateAt(lastMonth.year, lastMonth.month, 8, 9, 30), amount: 138000, description: "Isi bensin motor", merchantName: "Shell", categoryId: getCategoryId("Transportasi", "expense"), type: "expense" as const, paymentMethod: "cash", accountId: accountByName.Cash },
        { date: dateAt(lastMonth.year, lastMonth.month, 10, 15, 0), amount: 2100000, description: "Freelance dashboard analytics", merchantName: "Client B", categoryId: getCategoryId("Freelance", "income"), type: "income" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },
        { date: dateAt(lastMonth.year, lastMonth.month, 11, 20, 40), amount: 965000, description: "Belanja bulanan", merchantName: "Superindo", categoryId: getCategoryId("Belanja", "expense"), type: "expense" as const, paymentMethod: "debit", accountId: accountByName.BCA },
        { date: dateAt(lastMonth.year, lastMonth.month, 12, 17, 20), amount: 429000, description: "Tagihan WiFi rumah", merchantName: "Indihome", categoryId: getCategoryId("Tagihan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(lastMonth.year, lastMonth.month, 14, 21, 30), amount: 402914, description: "Belanja di Cinema XXI", merchantName: "Cinema XXI", categoryId: getCategoryId("Lainnya", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(lastMonth.year, lastMonth.month, 18, 15, 0), amount: 1650000, description: "Beli BBCA 1 lot lebih", merchantName: "Ajaib", categoryId: getCategoryId("Investasi", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(lastMonth.year, lastMonth.month, 22, 17, 30), amount: 447981, description: "Belanja di Starbucks", merchantName: "Starbucks", categoryId: getCategoryId("Lainnya", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(lastMonth.year, lastMonth.month, 27, 11, 45), amount: 950000, description: "Tabungan MacBook", merchantName: "Transfer Internal", categoryId: getCategoryId("Tabungan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },

        { date: dateAt(currentMonth.year, currentMonth.month, 1, 8, 5), amount: 9200000, description: "Gaji Bulanan", merchantName: "PT Monev Nusantara", categoryId: getCategoryId("Gaji", "income"), type: "income" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(currentMonth.year, currentMonth.month, 2, 19, 5), amount: 1500000, description: "Bayar kos bulanan", merchantName: "Ibu Kos", categoryId: getCategoryId("Tagihan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },
        { date: dateAt(currentMonth.year, currentMonth.month, 3, 12, 5), amount: 39000, description: "Makan siang bakso", merchantName: "Bakso Pak Man", categoryId: getCategoryId("Makan & Minuman", "expense"), type: "expense" as const, paymentMethod: "cash", accountId: accountByName.Cash },
        { date: dateAt(currentMonth.year, currentMonth.month, 5, 8, 0), amount: 186000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "gopay", accountId: accountByName.GoPay },
        { date: dateAt(currentMonth.year, currentMonth.month, 6, 8, 5), amount: 89000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCategoryId("Hiburan", "expense"), type: "expense" as const, paymentMethod: "gopay", accountId: accountByName.GoPay },
        { date: dateAt(currentMonth.year, currentMonth.month, 7, 9, 35), amount: 128000, description: "Isi bensin mobil", merchantName: "Pertamina", categoryId: getCategoryId("Transportasi", "expense"), type: "expense" as const, paymentMethod: "debit", accountId: accountByName.BCA },
        { date: dateAt(currentMonth.year, currentMonth.month, 9, 14, 15), amount: 1800000, description: "Freelance audit dashboard", merchantName: "Client C", categoryId: getCategoryId("Freelance", "income"), type: "income" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },
        { date: dateAt(currentMonth.year, currentMonth.month, 10, 20, 10), amount: 108783, description: "Belanja di ShopeeFood", merchantName: "ShopeeFood", categoryId: getCategoryId("Lainnya", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(currentMonth.year, currentMonth.month, 12, 17, 0), amount: 429000, description: "Tagihan WiFi rumah", merchantName: "Indihome", categoryId: getCategoryId("Tagihan", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.BCA },
        { date: dateAt(currentMonth.year, currentMonth.month, 14, 10, 30), amount: 1150000, description: "Belanja bulanan", merchantName: "Transmart", categoryId: getCategoryId("Belanja", "expense"), type: "expense" as const, paymentMethod: "debit", accountId: accountByName.BCA },
        { date: dateAt(currentMonth.year, currentMonth.month, 16, 13, 20), amount: 2250000, description: "Top up reksadana pasar uang", merchantName: "Bibit", categoryId: getCategoryId("Investasi", "expense"), type: "expense" as const, paymentMethod: "transfer", accountId: accountByName.Mandiri },
        { date: dateAt(currentMonth.year, currentMonth.month, 18, 15, 0), amount: 402914, description: "Belanja di Cinema XXI", merchantName: "Cinema XXI", categoryId: getCategoryId("Lainnya", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
        { date: dateAt(currentMonth.year, currentMonth.month, 21, 17, 30), amount: 447981, description: "Belanja di Starbucks", merchantName: "Starbucks", categoryId: getCategoryId("Lainnya", "expense"), type: "expense" as const, paymentMethod: "qris", accountId: accountByName.GoPay },
    ];

    const insertedTransactions = await db.insert(transactions).values(
        transactionRows.map((row) => ({
            userId,
            ...row,
            isVerified: true,
            isRecurring: ["Netflix Premium", "Spotify Family"].includes(row.description),
            createdAt: row.date,
        }))
    ).returning();

    console.log("🧾 Membuat bill payments...");
    const billByName = Object.fromEntries(insertedBills.map((bill) => [bill.name, bill.id]));
    const paymentTransactionByDescription = Object.fromEntries(
        insertedTransactions.map((transaction) => [transaction.description + transaction.date.toISOString(), transaction.id])
    );

    const billPaymentRows = [
        { billName: "Netflix Premium", date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 4, 18, 25), amount: 185000, transactionDescription: "Netflix Premium" },
        { billName: "Spotify Family", date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 5, 8, 5), amount: 89000, transactionDescription: "Spotify Family" },
        { billName: "WiFi Indihome", date: dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 12, 7, 30), amount: 429000, transactionDescription: "Tagihan WiFi rumah" },
        { billName: "Netflix Premium", date: dateAt(lastMonth.year, lastMonth.month, 5, 8, 0), amount: 186000, transactionDescription: "Netflix Premium" },
        { billName: "Spotify Family", date: dateAt(lastMonth.year, lastMonth.month, 6, 8, 5), amount: 89000, transactionDescription: "Spotify Family" },
        { billName: "WiFi Indihome", date: dateAt(lastMonth.year, lastMonth.month, 12, 17, 20), amount: 429000, transactionDescription: "Tagihan WiFi rumah" },
        { billName: "Netflix Premium", date: dateAt(currentMonth.year, currentMonth.month, 5, 8, 0), amount: 186000, transactionDescription: "Netflix Premium" },
        { billName: "Spotify Family", date: dateAt(currentMonth.year, currentMonth.month, 6, 8, 5), amount: 89000, transactionDescription: "Spotify Family" },
        { billName: "WiFi Indihome", date: dateAt(currentMonth.year, currentMonth.month, 12, 17, 0), amount: 429000, transactionDescription: "Tagihan WiFi rumah" },
    ];

    await db.insert(billPayments).values(
        billPaymentRows.map((payment) => ({
            billId: billByName[payment.billName],
            userId,
            amount: payment.amount,
            paidAt: payment.date,
            transactionId: paymentTransactionByDescription[payment.transactionDescription + payment.date.toISOString()] ?? null,
            notes: `Pembayaran ${payment.billName}`,
        }))
    );

    console.log("🏆 Membuat achievements...");

    // Create achievement definitions (reference data)
    const achievementDefs = [
        { code: "first_tx", name: "Pencatat Pemula", description: "Mencatat transaksi pertama kali", icon: "📝", tier: "starter", points: 10, category: "transaksi" },
        { code: "streak_7", name: "Semangat 7 Hari", description: "Konsisten mencatat selama seminggu", icon: "🔥", tier: "starter", points: 25, category: "streak" },
        { code: "first_goal", name: "Pemimpi Cerdas", description: "Membuat goal pertama", icon: "🎯", tier: "starter", points: 10, category: "goal" },
    ];

    // Upsert achievement definitions
    for (const def of achievementDefs) {
        const existing = db.select().from(achievements).where(eq(achievements.code, def.code)).get();
        if (!existing) {
            await db.insert(achievements).values(def);
        }
    }

    // Link user to achievements via junction table
    const allDefs = db.select().from(achievements).all();
    const txTime = dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 1, 8, 20);
    const streakTime = dateAt(lastMonth.year, lastMonth.month, 8, 9, 0);
    const goalTime = dateAt(twoMonthsAgo.year, twoMonthsAgo.month, 2, 10, 0);

    const codeToTime: Record<string, Date> = {
        first_tx: txTime,
        streak_7: streakTime,
        first_goal: goalTime,
    };

    for (const def of allDefs) {
        const unlockTime = codeToTime[def.code];
        if (unlockTime) {
            await db.insert(userAchievements).values({
                userId,
                achievementId: def.id,
                unlockedAt: unlockTime,
                progress: 100,
            }).onConflictDoNothing();
        }
    }

    const summary = {
        accounts: insertedAccounts.length,
        goals: insertedGoals.length,
        bills: insertedBills.length,
        transactions: insertedTransactions.length,
        budgets: 18,
        investments: 3,
        debts: 2,
        achievements: 3,
    };

    console.log("\n✅ Seed selesai untuk admin@monev.app");
    console.log(JSON.stringify(summary, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Gagal seed admin@monev.app:", error);
        process.exit(1);
    });
