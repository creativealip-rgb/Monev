/**
 * Seed script untuk admin@monevapp.com
 * Menambahkan data dummy realistis selama 3 bulan terakhir (Des 2025 - Feb 2026)
 */

import { getDb } from "../src/backend/db/index";
import {
    categories,
    transactions,
    budgets,
    goals,
    users,
    accounts,
    bills,
    investments,
    debts,
} from "../src/backend/db/schema";
import type { Category } from "../src/backend/db/schema";
import { and, eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@monevapp.com";

// Helper functions
const getCatId = (cats: Category[], name: string) => cats.find((c) => c.name === name)?.id || 1;

const randomDate = (year: number, month: number, minDay = 1, maxDay = 28) => {
    const day = Math.floor(Math.random() * (maxDay - minDay + 1)) + minDay;
    return new Date(year, month - 1, day);
};

const randomAmount = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedAdminData() {
    const db = getDb();
    console.log("🚀 Memulai seed data untuk admin@monevapp.com...");

    // 1. Cari user admin
    const adminUser = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).get();
    if (!adminUser) {
        console.error(`❌ User ${ADMIN_EMAIL} tidak ditemukan!`);
        process.exit(1);
    }

    const userId = adminUser.id;
    console.log(`✅ User admin ditemukan (ID: ${userId})`);

    // 2. Pastikan kategori tersedia
    let cats = await db.select().from(categories).all();
    if (cats.length === 0) {
        console.log("⏳ Membuat kategori default...");
        await db.insert(categories).values([
            { name: "Makan & Minuman", color: "#f97316", icon: "Utensils", type: "expense" },
            { name: "Transportasi", color: "#3b82f6", icon: "Car", type: "expense" },
            { name: "Hiburan", color: "#a855f7", icon: "Gamepad2", type: "expense" },
            { name: "Belanja", color: "#ec4899", icon: "ShoppingBag", type: "expense" },
            { name: "Kesehatan", color: "#22c55e", icon: "Heart", type: "expense" },
            { name: "Pendidikan", color: "#14b8a6", icon: "BookOpen", type: "expense" },
            { name: "Tagihan", color: "#ef4444", icon: "Receipt", type: "expense" },
            { name: "Investasi", color: "#10b981", icon: "TrendingUp", type: "expense" },
            { name: "Tabungan", color: "#3b82f6", icon: "Wallet", type: "expense" },
            { name: "Gaji", color: "#22c55e", icon: "Banknote", type: "income" },
            { name: "Freelance", color: "#8b5cf6", icon: "Briefcase", type: "income" },
            { name: "Dividen", color: "#eab308", icon: "Coins", type: "income" },
            { name: "Lainnya", color: "#64748b", icon: "MoreHorizontal", type: "expense" },
        ]);
        cats = await db.select().from(categories).all();
    }
    console.log(`✅ ${cats.length} kategori tersedia`);

    // 3. Buat Akun (Accounts)
    console.log("⏳ Membuat akun-akun...");
    const existingAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId)).all();
    if (existingAccounts.length === 0) {
        await db.insert(accounts).values([
            { userId, name: "BCA", type: "bank", balance: 8500000, color: "#3b82f6", icon: "Building2" },
            { userId, name: "GoPay", type: "emoney", balance: 2500000, color: "#00aed8", icon: "Wallet" },
            { userId, name: "Cash", type: "cash", balance: 1500000, color: "#22c55e", icon: "Banknote" },
            { userId, name: "Mandiri", type: "bank", balance: 12000000, color: "#f97316", icon: "Building2" },
            { userId, name: "CC BCA", type: "credit_card", balance: -3500000, color: "#ef4444", icon: "CreditCard" },
        ]);
        console.log("✅ 5 akun dibuat");
    } else {
        console.log(`✅ ${existingAccounts.length} akun sudah ada`);
    }
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId)).all();

    // 4. Buat Goals (Tabungan)
    console.log("⏳ Membuat goals...");
    const existingGoals = await db.select().from(goals).where(eq(goals.userId, userId)).all();
    if (existingGoals.length === 0) {
        await db.insert(goals).values([
            {
                userId,
                name: "MacBook Air M3",
                targetAmount: 22000000,
                currentAmount: 12500000,
                deadline: new Date("2026-06-01"),
                icon: "Laptop",
                color: "#3b82f6",
            },
            {
                userId,
                name: "Emergency Fund",
                targetAmount: 50000000,
                currentAmount: 28500000,
                deadline: new Date("2026-12-31"),
                icon: "Shield",
                color: "#22c55e",
            },
            {
                userId,
                name: "Liburan Jepang",
                targetAmount: 45000000,
                currentAmount: 18500000,
                deadline: new Date("2026-08-01"),
                icon: "Plane",
                color: "#f97316",
            },
            {
                userId,
                name: "DP Rumah",
                targetAmount: 150000000,
                currentAmount: 45000000,
                deadline: new Date("2027-12-31"),
                icon: "Home",
                color: "#a855f7",
            },
            {
                userId,
                name: "Motor NMAX 2026",
                targetAmount: 38000000,
                currentAmount: 22000000,
                deadline: new Date("2026-09-01"),
                icon: "Bike",
                color: "#ec4899",
            },
        ]);
        console.log("✅ 5 goals dibuat");
    } else {
        console.log(`✅ ${existingGoals.length} goals sudah ada`);
    }

    // 5. Buat Budgets untuk 3 bulan (Des 2025, Jan 2026, Feb 2026)
    console.log("⏳ Membuat budgets...");
    const budgetPeriods = [
        { month: 12, year: 2025 },
        { month: 1, year: 2026 },
        { month: 2, year: 2026 },
    ];

    const budgetCategories = [
        { name: "Makan & Minuman", amount: 3000000 },
        { name: "Transportasi", amount: 1500000 },
        { name: "Hiburan", amount: 1000000 },
        { name: "Belanja", amount: 2000000 },
        { name: "Kesehatan", amount: 750000 },
        { name: "Tagihan", amount: 1500000 },
    ];

    for (const period of budgetPeriods) {
        const existing = await db
            .select()
            .from(budgets)
            .where(
                and(
                    eq(budgets.userId, userId),
                    eq(budgets.month, period.month),
                    eq(budgets.year, period.year)
                )
            )
            .all();

        if (existing.length === 0) {
            for (const cat of budgetCategories) {
                const catId = getCatId(cats, cat.name);
                await db.insert(budgets).values({
                    userId,
                    categoryId: catId,
                    amount: cat.amount,
                    month: period.month,
                    year: period.year,
                });
            }
        }
    }
    console.log("✅ Budgets untuk 3 bulan dibuat");

    // 6. Buat Bills (Tagihan)
    console.log("⏳ Membuat bills...");
    const existingBills = await db.select().from(bills).where(eq(bills.userId, userId)).all();
    if (existingBills.length === 0) {
        await db.insert(bills).values([
            {
                userId,
                name: "Listrik PLN",
                amount: 450000,
                categoryId: getCatId(cats, "Tagihan"),
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
                categoryId: getCatId(cats, "Tagihan"),
                dueDate: 15,
                frequency: "monthly",
                icon: "Wifi",
                color: "#3b82f6",
                isSubscription: false,
            },
            {
                userId,
                name: "Netflix Premium",
                amount: 186000,
                categoryId: getCatId(cats, "Hiburan"),
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
                categoryId: getCatId(cats, "Hiburan"),
                dueDate: 10,
                frequency: "monthly",
                icon: "Music",
                color: "#22c55e",
                isSubscription: true,
            },
            {
                userId,
                name: "Gym Membership",
                amount: 550000,
                categoryId: getCatId(cats, "Kesehatan"),
                dueDate: 1,
                frequency: "monthly",
                icon: "Dumbbell",
                color: "#a855f7",
                isSubscription: true,
            },
            {
                userId,
                name: "BPJS Kesehatan",
                amount: 150000,
                categoryId: getCatId(cats, "Kesehatan"),
                dueDate: 25,
                frequency: "monthly",
                icon: "Heart",
                color: "#ec4899",
                isSubscription: false,
            },
        ]);
        console.log("✅ 6 bills dibuat");
    } else {
        console.log(`✅ ${existingBills.length} bills sudah ada`);
    }

    // 7. Buat Investments (Investasi)
    console.log("⏳ Membuat investments...");
    const existingInvestments = await db.select().from(investments).where(eq(investments.userId, userId)).all();
    if (existingInvestments.length === 0) {
        await db.insert(investments).values([
            {
                userId,
                name: "BBCA",
                type: "stock",
                quantity: 1000,
                avgBuyPrice: 9200,
                currentPrice: 10800,
                platform: "Ajaib",
                icon: "BarChart",
                color: "#3b82f6",
                totalDividends: 250000,
                realizedProfit: 0,
            },
            {
                userId,
                name: "BBRI",
                type: "stock",
                quantity: 2000,
                avgBuyPrice: 4100,
                currentPrice: 4650,
                platform: "Stockbit",
                icon: "BarChart",
                color: "#22c55e",
                totalDividends: 180000,
                realizedProfit: 50000,
            },
            {
                userId,
                name: "Emas Antam 10g",
                type: "gold",
                quantity: 15,
                avgBuyPrice: 1050000,
                currentPrice: 1285000,
                platform: "Pegadaian",
                icon: "Award",
                color: "#eab308",
                totalDividends: 0,
                realizedProfit: 0,
            },
            {
                userId,
                name: "S&P 500 ETF",
                type: "mutual_fund",
                quantity: 50,
                avgBuyPrice: 850000,
                currentPrice: 920000,
                platform: "Bibit",
                icon: "TrendingUp",
                color: "#6366f1",
                totalDividends: 125000,
                realizedProfit: 0,
            },
        ]);
        console.log("✅ 4 investments dibuat");
    } else {
        console.log(`✅ ${existingInvestments.length} investments sudah ada`);
    }

    // 8. Buat Transactions (Transaksi) - Data Realistis 3 Bulan
    console.log("⏳ Membuat transaksi...");
    const existingTrans = await db.select().from(transactions).where(eq(transactions.userId, userId)).all();
    if (existingTrans.length > 50) {
        console.log(`✅ ${existingTrans.length} transaksi sudah cukup banyak, skip penambahan`);
    } else {
        const allTransactions: any[] = [];

        // Desember 2025
        allTransactions.push(
            // Income
            { userId, amount: 8500000, description: "Gaji Bulan Desember", merchantName: "PT Maju Teknologi", categoryId: getCatId(cats, "Gaji"), type: "income", paymentMethod: "transfer", date: new Date("2025-12-01"), isVerified: true },
            { userId, amount: 3500000, description: "Project Website Company Profile", merchantName: "Client A", categoryId: getCatId(cats, "Freelance"), type: "income", paymentMethod: "transfer", date: new Date("2025-12-15"), isVerified: true },
            { userId, amount: 280000, description: "Dividen BBCA Q4", merchantName: "Ajaib", categoryId: getCatId(cats, "Dividen"), type: "income", paymentMethod: "transfer", date: new Date("2025-12-20"), isVerified: true },

            // Recurring expenses
            { userId, amount: 186000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-05"), isVerified: true, isRecurring: true },
            { userId, amount: 89000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-10"), isVerified: true, isRecurring: true },
            { userId, amount: 429000, description: "WiFi Indihome", merchantName: "Indihome", categoryId: getCatId(cats, "Tagihan"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-15"), isVerified: true, isRecurring: true },
            { userId, amount: 550000, description: "Gym Membership", merchantName: "Fitness First", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-01"), isVerified: true, isRecurring: true },

            // Food & Drink
            { userId, amount: 28000, description: "Kopi Susu Gula Aren", merchantName: "Kopi Janji Jiwa", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-02"), isVerified: true },
            { userId, amount: 45000, description: "Nasi Padang Komplit", merchantName: "Restoran Padang", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2025-12-03"), isVerified: true },
            { userId, amount: 32000, description: "Ayam Geprek + Es Teh", merchantName: "Ayam Geprek Pak Kumis", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-04"), isVerified: true },
            { userId, amount: 85000, description: "Sushi Tei Dinner", merchantName: "Sushi Tei", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-06"), isVerified: true },
            { userId, amount: 25000, description: "Es Kopi Susu", merchantName: "Kopi Kenangan", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-07"), isVerified: true },
            { userId, amount: 42000, description: "Bakso Malang", merchantName: "Bakso Pak Djoko", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2025-12-08"), isVerified: true },
            { userId, amount: 65000, description: "Gojek Food - Sushi", merchantName: "Gojek", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-09"), isVerified: true },
            { userId, amount: 38000, description: "Nasi Goreng Seafood", merchantName: "Seafood 99", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-11"), isVerified: true },
            { userId, amount: 180000, description: "Hokben Family Pack", merchantName: "Hoka Hoka Bento", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-13"), isVerified: true },
            { userId, amount: 22000, description: "Kopi Hitam", merchantName: "Starbucks", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-14"), isVerified: true },
            { userId, amount: 55000, description: "Steak Ayam", merchantName: "Steak 21", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2025-12-16"), isVerified: true },
            { userId, amount: 78000, description: "Pizza Hut Personal", merchantName: "Pizza Hut", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-18"), isVerified: true },
            { userId, amount: 120000, description: "Christmas Dinner", merchantName: "The Social House", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-25"), isVerified: true },
            { userId, amount: 95000, description: "New Year's Eve Dinner", merchantName: "Skye Bar", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-31"), isVerified: true },

            // Transport
            { userId, amount: 125000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-05"), isVerified: true },
            { userId, amount: 45000, description: "Grab Ride ke Kantor", merchantName: "Grab", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-08"), isVerified: true },
            { userId, amount: 150000, description: "Parkir Bulanan", merchantName: "Parkir Gedung", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-01"), isVerified: true },
            { userId, amount: 135000, description: "Bensin Full Tank", merchantName: "Shell", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-12"), isVerified: true },
            { userId, amount: 52000, description: "Tol Cikampek", merchantName: "Jasa Marga", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-19"), isVerified: true },
            { userId, amount: 65000, description: "GoCar ke Bandara", merchantName: "Gojek", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-23"), isVerified: true },
            { userId, amount: 38000, description: "Grab Bike", merchantName: "Grab", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-27"), isVerified: true },

            // Shopping
            { userId, amount: 850000, description: "Belanja Bulanan Indomaret", merchantName: "Indomaret", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-10"), isVerified: true },
            { userId, amount: 1250000, description: "Shopee - Outfit Lebaran", merchantName: "Shopee", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-17"), isVerified: true },
            { userId, amount: 650000, description: "Keyboard Mechanical", merchantName: "Tokopedia", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-22"), isVerified: true },
            { userId, amount: 2800000, description: "Sepatu Running Nike", merchantName: "Zalora", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "credit_card", date: new Date("2025-12-26"), isVerified: true },

            // Entertainment
            { userId, amount: 185000, description: "Nonton Bioskop", merchantName: "XXI", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-14"), isVerified: true },
            { userId, amount: 350000, description: "Bowling & Karaoke", merchantName: "Timezone", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-21"), isVerified: true },
            { userId, amount: 75000, description: "Voucher Google Play", merchantName: "Alfamart", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "cash", date: new Date("2025-12-28"), isVerified: true },

            // Health
            { userId, amount: 450000, description: "Listrik PLN", merchantName: "PLN", categoryId: getCatId(cats, "Tagihan"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-20"), isVerified: true },
            { userId, amount: 150000, description: "BPJS Kesehatan", merchantName: "BPJS", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-25"), isVerified: true },
            { userId, amount: 350000, description: "Cek Kesehatan", merchantName: "Klinik Sehat", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "gopay", date: new Date("2025-12-11"), isVerified: true },

            // Savings/Investments
            { userId, amount: 2000000, description: "Tabungan Emergency Fund", merchantName: "Transfer", categoryId: getCatId(cats, "Tabungan"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-03"), isVerified: true },
            { userId, amount: 1500000, description: "Beli BBCA 100 lot", merchantName: "Ajaib", categoryId: getCatId(cats, "Investasi"), type: "expense", paymentMethod: "transfer", date: new Date("2025-12-18"), isVerified: true },
        );

        // Januari 2026
        allTransactions.push(
            // Income
            { userId, amount: 8500000, description: "Gaji Bulan Januari", merchantName: "PT Maju Teknologi", categoryId: getCatId(cats, "Gaji"), type: "income", paymentMethod: "transfer", date: new Date("2026-01-01"), isVerified: true },
            { userId, amount: 4200000, description: "Project Mobile App", merchantName: "Client B", categoryId: getCatId(cats, "Freelance"), type: "income", paymentMethod: "transfer", date: new Date("2026-01-22"), isVerified: true },
            { userId, amount: 95000, description: "Cashback CC BCA", merchantName: "BCA", categoryId: getCatId(cats, "Lainnya"), type: "income", paymentMethod: "transfer", date: new Date("2026-01-28"), isVerified: true },

            // Recurring expenses
            { userId, amount: 186000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-05"), isVerified: true, isRecurring: true },
            { userId, amount: 89000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-10"), isVerified: true, isRecurring: true },
            { userId, amount: 429000, description: "WiFi Indihome", merchantName: "Indihome", categoryId: getCatId(cats, "Tagihan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-15"), isVerified: true, isRecurring: true },
            { userId, amount: 550000, description: "Gym Membership", merchantName: "Fitness First", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-01"), isVerified: true, isRecurring: true },

            // Food & Drink
            { userId, amount: 32000, description: "Nasi Goreng Komplit", merchantName: "Nasi Goreng Pak Slamet", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-03"), isVerified: true },
            { userId, amount: 28000, description: "Kopi Susu Gula Aren", merchantName: "Kopi Janji Jiwa", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-04"), isVerified: true },
            { userId, amount: 55000, description: "Sushi Roll 8 pcs", merchantName: "Sushi Tei", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-05"), isVerified: true },
            { userId, amount: 48000, description: "Ayam Penyet", merchantName: "Ayam Penyet Pak Kumis", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-06"), isVerified: true },
            { userId, amount: 22000, description: "Es Kopi Susu", merchantName: "Kopi Kenangan", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-07"), isVerified: true },
            { userId, amount: 85000, description: "Pepper Lunch", merchantName: "Pepper Lunch", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-08"), isVerified: true },
            { userId, amount: 42000, description: "Mie Ayam Bakso", merchantName: "Mie Ayam Pak Min", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-09"), isVerified: true },
            { userId, amount: 35000, description: "Nasi Uduk Komplit", merchantName: "Nasi Uduk Betawi", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-11"), isVerified: true },
            { userId, amount: 28000, description: "Kopi Latte", merchantName: "Starbucks", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-12"), isVerified: true },
            { userId, amount: 72000, description: "Yoshinoya Beef Bowl", merchantName: "Yoshinoya", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-13"), isVerified: true },
            { userId, amount: 45000, description: "Bakso Malang Spesial", merchantName: "Bakso Pak Djoko", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-14"), isVerified: true },
            { userId, amount: 32000, description: "KFC Snack Bucket", merchantName: "KFC", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-16"), isVerified: true },
            { userId, amount: 180000, description: "Hokben Deluxe", merchantName: "Hoka Hoka Bento", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-17"), isVerified: true },
            { userId, amount: 25000, description: "Es Teh & Roti", merchantName: "Roti O", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-18"), isVerified: true },
            { userId, amount: 95000, description: "Steak House", merchantName: "Holycow", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-19"), isVerified: true },
            { userId, amount: 28000, description: "Bubble Tea", merchantName: "Chatime", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-20"), isVerified: true },
            { userId, amount: 55000, description: "Burger King", merchantName: "Burger King", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-21"), isVerified: true },
            { userId, amount: 45000, description: "Nasi Campur Bali", merchantName: "Warung Bali", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-23"), isVerified: true },
            { userId, amount: 35000, description: "Gado-Gado", merchantName: "Gado-Gado Boplo", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-24"), isVerified: true },
            { userId, amount: 120000, description: "Hot Pot", merchantName: "Shabu Hachi", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-25"), isVerified: true },
            { userId, amount: 28000, description: "Donuts", merchantName: "J.CO", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-26"), isVerified: true },
            { userId, amount: 85000, description: "Pizza Margherita", merchantName: "Pizza Marzano", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-27"), isVerified: true },
            { userId, amount: 42000, description: "Soto Ayam", merchantName: "Soto Lamongan", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-29"), isVerified: true },
            { userId, amount: 32000, description: "Martabak", merchantName: "Martabak Bangka", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-30"), isVerified: true },
            { userId, amount: 150000, description: "All You Can Eat", merchantName: "Hachi Grill", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-31"), isVerified: true },

            // Transport
            { userId, amount: 140000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-02"), isVerified: true },
            { userId, amount: 48000, description: "Grab Ride ke Meeting", merchantName: "Grab", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-05"), isVerified: true },
            { userId, amount: 150000, description: "Parkir Bulanan", merchantName: "Parkir Gedung", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-01"), isVerified: true },
            { userId, amount: 155000, description: "Bensin Full Tank", merchantName: "Shell", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-10"), isVerified: true },
            { userId, amount: 62000, description: "Tol Dalam Kota", merchantName: "Jasa Marga", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-12"), isVerified: true },
            { userId, amount: 38000, description: "Grab Bike", merchantName: "Grab", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-15"), isVerified: true },
            { userId, amount: 125000, description: "Bensin", merchantName: "Pertamina", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "cash", date: new Date("2026-01-18"), isVerified: true },
            { userId, amount: 85000, description: "GoCar", merchantName: "Gojek", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-20"), isVerified: true },

            // Shopping
            { userId, amount: 950000, description: "Belanja Bulanan", merchantName: "Indomaret", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-09"), isVerified: true },
            { userId, amount: 2850000, description: "Shopee - Elektronik", merchantName: "Shopee", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-14"), isVerified: true },
            { userId, amount: 1250000, description: "Lazada - Home Decor", merchantName: "Lazada", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-24"), isVerified: true },
            { userId, amount: 850000, description: "Toped - Aksesoris", merchantName: "Tokopedia", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-28"), isVerified: true },

            // Entertainment
            { userId, amount: 195000, description: "Nonton Film", merchantName: "CGV", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-11"), isVerified: true },
            { userId, amount: 420000, description: "PlayStation Plus", merchantName: "PlayStation", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "credit_card", date: new Date("2026-01-13"), isVerified: true },
            { userId, amount: 280000, description: "Game Steam", merchantName: "Steam", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "credit_card", date: new Date("2026-01-16"), isVerified: true },

            // Health & Bills
            { userId, amount: 480000, description: "Listrik PLN", merchantName: "PLN", categoryId: getCatId(cats, "Tagihan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-20"), isVerified: true },
            { userId, amount: 150000, description: "BPJS Kesehatan", merchantName: "BPJS", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-25"), isVerified: true },
            { userId, amount: 550000, description: "Cek Rutin + Vitamin", merchantName: "Kimia Farma", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-01-19"), isVerified: true },

            // Savings/Investments
            { userId, amount: 2500000, description: "Tabungan MacBook", merchantName: "Transfer", categoryId: getCatId(cats, "Tabungan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-05"), isVerified: true },
            { userId, amount: 1000000, description: "Beli Emas 1g", merchantName: "Pegadaian", categoryId: getCatId(cats, "Investasi"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-12"), isVerified: true },
            { userId, amount: 2000000, description: "Top Up Reksadana", merchantName: "Bibit", categoryId: getCatId(cats, "Investasi"), type: "expense", paymentMethod: "transfer", date: new Date("2026-01-26"), isVerified: true },
        );

        // Februari 2026
        allTransactions.push(
            // Income
            { userId, amount: 9000000, description: "Gaji Bulan Februari + THR", merchantName: "PT Maju Teknologi", categoryId: getCatId(cats, "Gaji"), type: "income", paymentMethod: "transfer", date: new Date("2026-02-01"), isVerified: true },
            { userId, amount: 5500000, description: "Project E-Commerce", merchantName: "Client C", categoryId: getCatId(cats, "Freelance"), type: "income", paymentMethod: "transfer", date: new Date("2026-02-15"), isVerified: true },
            { userId, amount: 350000, description: "Dividen BBRI", merchantName: "Stockbit", categoryId: getCatId(cats, "Dividen"), type: "income", paymentMethod: "transfer", date: new Date("2026-02-20"), isVerified: true },

            // Recurring expenses
            { userId, amount: 186000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-05"), isVerified: true, isRecurring: true },
            { userId, amount: 89000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-10"), isVerified: true, isRecurring: true },
            { userId, amount: 429000, description: "WiFi Indihome", merchantName: "Indihome", categoryId: getCatId(cats, "Tagihan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-15"), isVerified: true, isRecurring: true },
            { userId, amount: 550000, description: "Gym Membership", merchantName: "Fitness First", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-01"), isVerified: true, isRecurring: true },

            // Food & Drink
            { userId, amount: 35000, description: "Bubur Ayam", merchantName: "Bubur Ayam Sukabumi", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-02"), isVerified: true },
            { userId, amount: 32000, description: "Kopi Susu", merchantName: "Kopi Janji Jiwa", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-03"), isVerified: true },
            { userId, amount: 58000, description: "Sushi Box", merchantName: "Sushi Tei", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-04"), isVerified: true },
            { userId, amount: 52000, description: "Bebek Goreng", merchantName: "Bebek Goreng H. Slamet", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-06"), isVerified: true },
            { userId, amount: 28000, description: "Es Kopi", merchantName: "Kopi Kenangan", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-07"), isVerified: true },
            { userId, amount: 95000, description: "Yakiniku", merchantName: "Gyu-Kaku", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-08"), isVerified: true },
            { userId, amount: 42000, description: "Bakso Malang", merchantName: "Bakso Pak Djoko", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-09"), isVerified: true },
            { userId, amount: 45000, description: "Nasi Goreng", merchantName: "Nasi Goreng 99", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-11"), isVerified: true },
            { userId, amount: 32000, description: "Kopi Latte", merchantName: "Starbucks", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-12"), isVerified: true },
            { userId, amount: 78000, description: "Sushi Train", merchantName: "Sushi Go", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-13"), isVerified: true },
            { userId, amount: 55000, description: "Steak", merchantName: "Abuba Steak", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-14"), isVerified: true },
            { userId, amount: 120000, description: "Valentine Dinner", merchantName: "SKYE", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-14"), isVerified: true },
            { userId, amount: 48000, description: "Ayam Penyet", merchantName: "Ayam Penyet Pak Kumis", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-16"), isVerified: true },
            { userId, amount: 25000, description: "Cappucino", merchantName: "Excelso", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-17"), isVerified: true },
            { userId, amount: 85000, description: "Pepper Lunch", merchantName: "Pepper Lunch", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-18"), isVerified: true },
            { userId, amount: 42000, description: "Mie Ayam", merchantName: "Mie Ayam Jakarta", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-19"), isVerified: true },
            { userId, amount: 35000, description: "Nasi Uduk", merchantName: "Nasi Uduk Betawi", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-21"), isVerified: true },
            { userId, amount: 28000, description: "Bubble Tea", merchantName: "Gulu Gulu", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-22"), isVerified: true },
            { userId, amount: 150000, description: "Seafood", merchantName: "Bandar Djakarta", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-23"), isVerified: true },
            { userId, amount: 32000, description: "Donut", merchantName: "Dunkin Donuts", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-24"), isVerified: true },
            { userId, amount: 55000, description: "Burger", merchantName: "Burger King", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-25"), isVerified: true },
            { userId, amount: 45000, description: "Nasi Campur", merchantName: "Warung Bali", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-26"), isVerified: true },
            { userId, amount: 85000, description: "Pizza", merchantName: "Domino's", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-27"), isVerified: true },
            { userId, amount: 120000, description: "Hot Pot", merchantName: "Shabu Hachi", categoryId: getCatId(cats, "Makan & Minuman"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-28"), isVerified: true },

            // Transport
            { userId, amount: 145000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-02"), isVerified: true },
            { userId, amount: 52000, description: "Grab Ride", merchantName: "Grab", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-05"), isVerified: true },
            { userId, amount: 150000, description: "Parkir Bulanan", merchantName: "Parkir Gedung", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-01"), isVerified: true },
            { userId, amount: 160000, description: "Bensin Full Tank", merchantName: "Shell", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-09"), isVerified: true },
            { userId, amount: 68000, description: "Tol Bandara", merchantName: "Jasa Marga", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-14"), isVerified: true },
            { userId, amount: 42000, description: "Grab Bike", merchantName: "Grab", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-17"), isVerified: true },
            { userId, amount: 135000, description: "Bensin", merchantName: "Pertamina", categoryId: getCatId(cats, "Transportasi"), type: "expense", paymentMethod: "cash", date: new Date("2026-02-20"), isVerified: true },

            // Shopping
            { userId, amount: 1050000, description: "Belanja Bulanan", merchantName: "Indomaret", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-08"), isVerified: true },
            { userId, amount: 3200000, description: "Shopee - Gadget", merchantName: "Shopee", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-13"), isVerified: true },
            { userId, amount: 1450000, description: "Tokopedia - Fashion", merchantName: "Tokopedia", categoryId: getCatId(cats, "Belanja"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-22"), isVerified: true },

            // Entertainment
            { userId, amount: 185000, description: "Nonton Bioskop", merchantName: "XXI", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-07"), isVerified: true },
            { userId, amount: 450000, description: "Timezone", merchantName: "Timezone", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-15"), isVerified: true },
            { userId, amount: 320000, description: "Steam Wallet", merchantName: "Steam", categoryId: getCatId(cats, "Hiburan"), type: "expense", paymentMethod: "credit_card", date: new Date("2026-02-19"), isVerified: true },

            // Health & Bills
            { userId, amount: 510000, description: "Listrik PLN", merchantName: "PLN", categoryId: getCatId(cats, "Tagihan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-20"), isVerified: true },
            { userId, amount: 150000, description: "BPJS Kesehatan", merchantName: "BPJS", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-25"), isVerified: true },
            { userId, amount: 450000, description: "Pijat + Spa", merchantName: "Taman Sari", categoryId: getCatId(cats, "Kesehatan"), type: "expense", paymentMethod: "gopay", date: new Date("2026-02-12"), isVerified: true },

            // Savings/Investments
            { userId, amount: 3000000, description: "Tabungan DP Rumah", merchantName: "Transfer", categoryId: getCatId(cats, "Tabungan"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-05"), isVerified: true },
            { userId, amount: 1500000, description: "Beli Saham BBRI", merchantName: "Stockbit", categoryId: getCatId(cats, "Investasi"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-18"), isVerified: true },
            { userId, amount: 2500000, description: "Top Up S&P 500", merchantName: "Bibit", categoryId: getCatId(cats, "Investasi"), type: "expense", paymentMethod: "transfer", date: new Date("2026-02-28"), isVerified: true },
        );

        // Insert semua transaksi
        for (const tx of allTransactions) {
            await db.insert(transactions).values(tx);
        }
        console.log(`✅ ${allTransactions.length} transaksi berhasil dibuat`);
    }

    // 9. Buat Hutang (Debts)
    console.log("⏳ Membuat debts...");
    const existingDebts = await db.select().from(debts).where(eq(debts.userId, userId)).all();
    if (existingDebts.length === 0) {
        await db.insert(debts).values([
            { userId, debtorName: "Budi Santoso", amount: 500000, description: "Pinjaman makan bareng", dueDate: new Date("2026-03-15"), status: "unpaid" },
            { userId, debtorName: "Ani Wijaya", amount: 750000, description: "Patungan kado", dueDate: new Date("2026-03-10"), status: "unpaid" },
            { userId, debtorName: "Citra Dewi", amount: 350000, description: "Pinjaman transport", dueDate: new Date("2026-02-28"), status: "paid" },
            { userId, debtorName: "Dodi Pratama", amount: 1200000, description: "Pinjaman darurat", dueDate: new Date("2026-03-20"), status: "unpaid" },
        ]);
        console.log("✅ 4 debts dibuat");
    } else {
        console.log(`✅ ${existingDebts.length} debts sudah ada`);
    }

    console.log("\n🎉 Seeding selesai! Data dummy telah ditambahkan untuk admin@monevapp.com");
    console.log("\nRingkasan:");
    console.log(`- User ID: ${userId}`);
    console.log(`- Akun: ${(await db.select().from(accounts).where(eq(accounts.userId, userId)).all()).length}`);
    console.log(`- Goals: ${(await db.select().from(goals).where(eq(goals.userId, userId)).all()).length}`);
    console.log(`- Budgets: ${(await db.select().from(budgets).where(eq(budgets.userId, userId)).all()).length}`);
    console.log(`- Bills: ${(await db.select().from(bills).where(eq(bills.userId, userId)).all()).length}`);
    console.log(`- Investments: ${(await db.select().from(investments).where(eq(investments.userId, userId)).all()).length}`);
    console.log(`- Transactions: ${(await db.select().from(transactions).where(eq(transactions.userId, userId)).all()).length}`);
    console.log(`- Debts: ${(await db.select().from(debts).where(eq(debts.userId, userId)).all()).length}`);
}

seedAdminData()
    .then(() => {
        console.log("\n✨ Script berhasil dijalankan!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Error:", error);
        process.exit(1);
    });
