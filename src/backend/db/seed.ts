import { getDb } from "./index";
import { categories, transactions, budgets, goals, users } from "./schema";
import type { Category } from "./schema";
import { and, eq } from "drizzle-orm";

export async function seedDatabase() {
    const db = getDb();

    // 1. Ensure we have a user to seed data for
    let user = await db.select().from(users).limit(1).get();

    if (!user) {
        console.log("No users found. Creating 'Demo User' for seeding...");
        user = await db.insert(users).values({
            telegramId: 123456789,
            username: "demo_user",
            firstName: "Demo",
            lastName: "User",
            whatsappId: "628000000000"
        }).returning().get();
    }

    const userId = user.id;

    // Check if already has February 2026 data
    const existingTrans = db.select().from(transactions).where(eq(transactions.userId, userId)).all();
    const hasFebruaryData = existingTrans.some((t: { date: Date }) => {
        const date = new Date(t.date);
        return date.getMonth() === 1 && date.getFullYear() === 2026; // February = month 1
    });

    // Check if we need to do initial seed
    const existingCategories = db.select().from(categories).all();
    if (existingCategories.length === 0) {
        // Do full seed (initial setup)
        console.log(`Seeding database for user ${userId}...`);
        await doFullSeed(db, userId);
    } else if (!hasFebruaryData) {
        // Just add February 2026 data
        console.log(`Adding February 2026 data for user ${userId}...`);
        await addFebruaryData(db, userId);
    }

    // Always ensure budgets and goals exist for demo purposes
    await ensureSampleBudgetsAndGoals(db, userId);
}

async function doFullSeed(db: any, userId: number) {

    // Insert Categories
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
        { name: "Gaji", color: "#3b82f6", icon: "Banknote", type: "income" },
        { name: "Freelance", color: "#8b5cf6", icon: "Briefcase", type: "income" },
        { name: "Lainnya", color: "#64748b", icon: "MoreHorizontal", type: "expense" },
    ]);

    // Get category IDs
    const cats = db.select().from(categories).all();
    const getCatId = (name: string) => cats.find((c: Category) => c.name === name)?.id || 1;

    // Insert Transactions (Indonesian context)
    await db.insert(transactions).values([
        // November 2025
        { userId, amount: 25000, description: "Es Kopi Susu", merchantName: "Kopi Kenangan", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-11-28"), isVerified: true },
        { userId, amount: 32000, description: "Nasi Goreng Seafood", merchantName: "Warung Nasi 99", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "cash", date: new Date("2025-11-27"), isVerified: true },
        { userId, amount: 150000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "transfer", date: new Date("2025-11-25"), isVerified: true, isRecurring: true },
        { userId, amount: 45000, description: "Grab Ride ke Kantor", merchantName: "Grab", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-11-24"), isVerified: true },
        { userId, amount: 5000000, description: "Gaji Bulan November", merchantName: "PT Digital Indonesia", categoryId: getCatId("Gaji"), type: "income" as const, paymentMethod: "transfer", date: new Date("2025-11-01"), isVerified: true },
        { userId, amount: 185000, description: "Spotify Family", merchantName: "Spotify", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-11-05"), isVerified: true, isRecurring: true },
        { userId, amount: 275000, description: "Belanja Bulanan", merchantName: "Indomaret", categoryId: getCatId("Belanja"), type: "expense" as const, paymentMethod: "cash", date: new Date("2025-11-10"), isVerified: true },
        { userId, amount: 120000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "cash", date: new Date("2025-11-08"), isVerified: true },
        { userId, amount: 75000, description: "Parkir Kantor", merchantName: "Parkir Gedung", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "cash", date: new Date("2025-11-15"), isVerified: true },
        { userId, amount: 2500000, description: "Project Website", merchantName: "Client A", categoryId: getCatId("Freelance"), type: "income" as const, paymentMethod: "transfer", date: new Date("2025-11-20"), isVerified: true },

        // December 2025
        { userId, amount: 28000, description: "Ayam Geprek + Es Teh", merchantName: "Ayam Geprek Pak Kumis", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-12-05"), isVerified: true },
        { userId, amount: 52000, description: "Gojek Food - Sushi", merchantName: "Gojek", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-12-08"), isVerified: true },
        { userId, amount: 150000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "transfer", date: new Date("2025-12-25"), isVerified: true, isRecurring: true },
        { userId, amount: 5000000, description: "Gaji Bulan Desember", merchantName: "PT Digital Indonesia", categoryId: getCatId("Gaji"), type: "income" as const, paymentMethod: "transfer", date: new Date("2025-12-01"), isVerified: true },
        { userId, amount: 450000, description: "Keyboard Mechanical", merchantName: "Tokopedia", categoryId: getCatId("Belanja"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-12-12"), isVerified: true },
        { userId, amount: 35000, description: "Parkir Mall", merchantName: "Parkir Grand Indonesia", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "cash", date: new Date("2025-12-14"), isVerified: true },
        { userId, amount: 125000, description: "Nonton Bioskop", merchantName: "XXI", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2025-12-20"), isVerified: true },

        // January 2026
        { userId, amount: 22000, description: "Kopi Susu Gula Aren", merchantName: "Kopi Janji Jiwa", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-01-05"), isVerified: true },
        { userId, amount: 48000, description: "Nasi Campur Komplit", merchantName: "Nasi Campur Bali", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-01-08"), isVerified: true },
        { userId, amount: 150000, description: "Netflix Premium", merchantName: "Netflix", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "transfer", date: new Date("2026-01-25"), isVerified: true, isRecurring: true },
        { userId, amount: 5000000, description: "Gaji Bulan Januari", merchantName: "PT Digital Indonesia", categoryId: getCatId("Gaji"), type: "income" as const, paymentMethod: "transfer", date: new Date("2026-01-01"), isVerified: true },
        { userId, amount: 180000, description: "Voucher Google Play", merchantName: "Alfamart", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-01-10"), isVerified: true },
        { userId, amount: 95000, description: "Pijat Refleksi", merchantName: "Spa & Massage", categoryId: getCatId("Kesehatan"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-01-15"), isVerified: true },
        { userId, amount: 135000, description: "Bensin Full Tank", merchantName: "Shell", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-01-18"), isVerified: true },
        { userId, amount: 650000, description: "Belanja Online Shopee", merchantName: "Shopee", categoryId: getCatId("Belanja"), type: "expense" as const, paymentMethod: "transfer", date: new Date("2026-01-22"), isVerified: true },

        // February 2026 (current month)
        { userId, amount: 28000, description: "Kopi Susu", merchantName: "Kopi Kenangan", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-02-05"), isVerified: true },
        { userId, amount: 35000, description: "Nasi Goreng", merchantName: "Warung Nasi", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-02-06"), isVerified: true },
        { userId, amount: 5000000, description: "Gaji Bulan Februari", merchantName: "PT Digital Indonesia", categoryId: getCatId("Gaji"), type: "income" as const, paymentMethod: "transfer", date: new Date("2026-02-01"), isVerified: true },
        { userId, amount: 150000, description: "Spotify Premium", merchantName: "Spotify", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-02-05"), isVerified: true, isRecurring: true },
        { userId, amount: 45000, description: "Grab Ride", merchantName: "Grab", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-02-08"), isVerified: true },
        { userId, amount: 120000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-02-10"), isVerified: true },
    ]);

    // Insert Budgets (for January 2026 and February 2026)
    await db.insert(budgets).values([
        // January 2026
        { userId, categoryId: getCatId("Makan & Minuman"), amount: 2500000, month: 1, year: 2026 },
        { userId, categoryId: getCatId("Transportasi"), amount: 1000000, month: 1, year: 2026 },
        { userId, categoryId: getCatId("Hiburan"), amount: 800000, month: 1, year: 2026 },
        { userId, categoryId: getCatId("Belanja"), amount: 1500000, month: 1, year: 2026 },
        { userId, categoryId: getCatId("Kesehatan"), amount: 500000, month: 1, year: 2026 },
        { userId, categoryId: getCatId("Tagihan"), amount: 500000, month: 1, year: 2026 },
        // February 2026 (current month)
        { userId, categoryId: getCatId("Makan & Minuman"), amount: 2500000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Transportasi"), amount: 1000000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Hiburan"), amount: 800000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Belanja"), amount: 1500000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Kesehatan"), amount: 500000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Tagihan"), amount: 500000, month: 2, year: 2026 },
    ]);

    // Insert Goals
    await db.insert(goals).values([
        {
            userId,
            name: "MacBook Air M3",
            targetAmount: 20000000,
            currentAmount: 8500000,
            deadline: new Date("2026-06-01"),
            icon: "Laptop",
            color: "#3b82f6"
        },
        {
            userId,
            name: "Emergency Fund",
            targetAmount: 30000000,
            currentAmount: 12500000,
            deadline: new Date("2026-12-31"),
            icon: "Shield",
            color: "#22c55e"
        },
        {
            userId,
            name: "Liburan Jepang",
            targetAmount: 35000000,
            currentAmount: 5200000,
            deadline: new Date("2026-08-01"),
            icon: "Plane",
            color: "#f97316"
        },
    ]);

    console.log("Database seeded successfully!");
}

async function addFebruaryData(db: any, userId: number) {
    console.log("Adding February 2026 data...");

    // Get existing categories
    const cats = db.select().from(categories).all();
    const getCatId = (name: string) => cats.find((c: Category) => c.name === name)?.id || 1;

    // Add February 2026 transactions
    await db.insert(transactions).values([
        { userId, amount: 28000, description: "Kopi Susu", merchantName: "Kopi Kenangan", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-02-05"), isVerified: true },
        { userId, amount: 35000, description: "Nasi Goreng", merchantName: "Warung Nasi", categoryId: getCatId("Makan & Minuman"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-02-06"), isVerified: true },
        { userId, amount: 5000000, description: "Gaji Bulan Februari", merchantName: "PT Digital Indonesia", categoryId: getCatId("Gaji"), type: "income" as const, paymentMethod: "transfer", date: new Date("2026-02-01"), isVerified: true },
        { userId, amount: 150000, description: "Spotify Premium", merchantName: "Spotify", categoryId: getCatId("Hiburan"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-02-05"), isVerified: true, isRecurring: true },
        { userId, amount: 45000, description: "Grab Ride", merchantName: "Grab", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "gopay", date: new Date("2026-02-08"), isVerified: true },
        { userId, amount: 120000, description: "Bensin Pertamax", merchantName: "Pertamina", categoryId: getCatId("Transportasi"), type: "expense" as const, paymentMethod: "cash", date: new Date("2026-02-10"), isVerified: true },
    ]);

    // Add February 2026 budgets
    await db.insert(budgets).values([
        { userId, categoryId: getCatId("Makan & Minuman"), amount: 2500000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Transportasi"), amount: 1000000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Hiburan"), amount: 800000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Belanja"), amount: 1500000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Kesehatan"), amount: 500000, month: 2, year: 2026 },
        { userId, categoryId: getCatId("Tagihan"), amount: 500000, month: 2, year: 2026 },
    ]);

    console.log("February 2026 data added successfully!");
}

async function ensureSampleBudgetsAndGoals(db: any, userId: number) {
    const cats = db.select().from(categories).all();
    if (cats.length === 0) return;

    const getCatId = (name: string) => cats.find((c: Category) => c.name === name)?.id || 1;

    // Check current month budgets
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const existingBudgets = db.select().from(budgets).where(
        and(
            eq(budgets.month, currentMonth),
            eq(budgets.year, currentYear),
            eq(budgets.userId, userId)
        )
    ).all();

    // Add sample budgets if less than 3 exist
    if (existingBudgets.length < 3) {
        console.log("Adding sample budgets...");
        const sampleBudgets = [
            { userId, categoryId: getCatId("Makan & Minuman"), amount: 2500000, month: currentMonth, year: currentYear },
            { userId, categoryId: getCatId("Transportasi"), amount: 1000000, month: currentMonth, year: currentYear },
            { userId, categoryId: getCatId("Hiburan"), amount: 800000, month: currentMonth, year: currentYear },
        ];

        for (const budget of sampleBudgets) {
            const exists = existingBudgets.some((b: any) => b.categoryId === budget.categoryId);
            if (!exists) {
                await db.insert(budgets).values(budget);
            }
        }
    }

    // Check existing goals for user
    const existingGoals = db.select().from(goals).where(eq(goals.userId, userId)).all();

    // Add sample goals if less than 5 exist (3 original + 2 new)
    if (existingGoals.length < 5) {
        console.log("Adding sample goals...");
        const sampleGoals = [
            {
                userId,
                name: "MacBook Air M3",
                targetAmount: 20000000,
                currentAmount: 8500000,
                deadline: new Date("2026-06-01"),
                icon: "Laptop",
                color: "#3b82f6"
            },
            {
                userId,
                name: "Emergency Fund",
                targetAmount: 30000000,
                currentAmount: 12500000,
                deadline: new Date("2026-12-31"),
                icon: "Shield",
                color: "#22c55e"
            },
            {
                userId,
                name: "Liburan Jepang",
                targetAmount: 35000000,
                currentAmount: 5200000,
                deadline: new Date("2026-08-01"),
                icon: "Plane",
                color: "#f97316"
            },
            {
                userId,
                name: "iPhone 16 Pro",
                targetAmount: 18000000,
                currentAmount: 6200000,
                deadline: new Date("2026-05-01"),
                icon: "Smartphone",
                color: "#a855f7"
            },
            {
                userId,
                name: "Motor NMAX",
                targetAmount: 35000000,
                currentAmount: 15000000,
                deadline: new Date("2026-09-01"),
                icon: "Bike",
                color: "#ec4899"
            },
        ];

        for (const goal of sampleGoals) {
            const exists = existingGoals.some((g: any) => g.name === goal.name);
            if (!exists) {
                await db.insert(goals).values(goal);
            }
        }
    }

    console.log("Sample budgets and goals check complete!");
}

