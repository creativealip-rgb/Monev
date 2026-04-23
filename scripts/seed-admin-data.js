import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema.js";
import bcryptjs from "bcryptjs";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

const {
    users,
    categories,
    transactions,
    budgets,
    goals,
    userSettings,
} = schema;

async function seedAdminData() {
    console.log("🌱 Starting admin account seeding...");

    try {
        // 1. Create Admin User
        const hashedPassword = await bcryptjs.hash("admin123456", 10);

        const adminUser = db
            .insert(users)
            .values({
                email: "admin@monev.app",
                name: "Budi Santoso",
                firstName: "Budi",
                lastName: "Santoso",
                username: "budi_rantau",
                password: hashedPassword,
                tier: "pro",
                isAdmin: true,
                isActive: true,
                emailVerified: new Date(),
            })
            .returning()
            .get();

        console.log("✅ Admin user created:", {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
        });

        const userId = adminUser.id;

        // 2. Create/Get Categories
        const categoryData = [
            {
                name: "Makan & Minuman",
                color: "#f97316",
                icon: "Utensils",
                type: "expense",
            },
            {
                name: "Transportasi",
                color: "#3b82f6",
                icon: "Car",
                type: "expense",
            },
            {
                name: "Hiburan",
                color: "#a855f7",
                icon: "Gamepad2",
                type: "expense",
            },
            {
                name: "Belanja",
                color: "#ec4899",
                icon: "ShoppingBag",
                type: "expense",
            },
            {
                name: "Kesehatan",
                color: "#22c55e",
                icon: "Heart",
                type: "expense",
            },
            {
                name: "Pendidikan",
                color: "#14b8a6",
                icon: "BookOpen",
                type: "expense",
            },
            {
                name: "Tagihan",
                color: "#ef4444",
                icon: "Receipt",
                type: "expense",
            },
            {
                name: "Investasi",
                color: "#10b981",
                icon: "TrendingUp",
                type: "expense",
            },
            {
                name: "Tabungan",
                color: "#3b82f6",
                icon: "Wallet",
                type: "expense",
            },
            {
                name: "Gaji",
                color: "#3b82f6",
                icon: "Banknote",
                type: "income",
            },
            {
                name: "Freelance",
                color: "#8b5cf6",
                icon: "Briefcase",
                type: "income",
            },
            {
                name: "Transfer",
                color: "#6366f1",
                icon: "ArrowRightLeft",
                type: "expense",
            },
            {
                name: "Lainnya",
                color: "#64748b",
                icon: "MoreHorizontal",
                type: "expense",
            },
        ];

        db.insert(categories).values(
            categoryData.map((cat) => ({
                ...cat,
                userId: null,
                createdAt: new Date(),
            }))
        );

        const allCategories = db.select().from(categories).all();
        const getCatId = (name) =>
            allCategories.find((c) => c.name === name)?.id || 1;

        console.log("✅ Categories created/retrieved");

        // 3. Create Transactions for last 3 months (January, February, March 2026)
        const transactions_data = [
            // JANUARY 2026 - Start of Month
            {
                date: "2026-01-01",
                amount: 5000000,
                description: "Gaji Rutin Januari",
                merchant: "PT Tech Solutions",
                category: "Gaji",
                type: "income",
                method: "transfer",
            },
            {
                date: "2026-01-02",
                amount: 1500000,
                description: "Bayar Sewa Kosan",
                merchant: "Tuan Rumah",
                category: "Tagihan",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-01-03",
                amount: 25000,
                description: "Kopi Susu + Roti Bakar",
                merchant: "Kopi Kenangan",
                category: "Makan & Minuman",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-01-04",
                amount: 68000,
                description: "Nasi Goreng Seafood",
                merchant: "Warung Pak Hadi",
                category: "Makan & Minuman",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-01-05",
                amount: 50000,
                description: "Grab ke Kantor",
                merchant: "Grab",
                category: "Transportasi",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-01-06",
                amount: 150000,
                description: "Netflix Premium",
                merchant: "Netflix",
                category: "Hiburan",
                type: "expense",
                method: "gopay",
                recurring: true,
            },
            {
                date: "2026-01-07",
                amount: 175000,
                description: "Spotify Family",
                merchant: "Spotify",
                category: "Hiburan",
                type: "expense",
                method: "gopay",
                recurring: true,
            },
            {
                date: "2026-01-08",
                amount: 45000,
                description: "Minum Bubble Tea",
                merchant: "CoCo都可",
                category: "Makan & Minuman",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-01-10",
                amount: 800000,
                description: "Belanja Bulanan",
                merchant: "Indomaret",
                category: "Belanja",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-01-12",
                amount: 120000,
                description: "Bensin Penuh",
                merchant: "Shell",
                category: "Transportasi",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-01-15",
                amount: 95000,
                description: "Pijat + Spa Refleksi",
                merchant: "Pijat Express",
                category: "Kesehatan",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-01-18",
                amount: 350000,
                description: "Beli Monitor Baru",
                merchant: "Tokopedia",
                category: "Belanja",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-01-20",
                amount: 55000,
                description: "Makan Pizza",
                merchant: "Pizza Hut",
                category: "Makan & Minuman",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-01-22",
                amount: 2000000,
                description: "Project Freelance - Web Design",
                merchant: "Client B",
                category: "Freelance",
                type: "income",
                method: "transfer",
            },
            {
                date: "2026-01-25",
                amount: 600000,
                description: "Cicilan Laptop",
                merchant: "Bank BCA",
                category: "Transfer",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-01-28",
                amount: 500000,
                description: "Investasi Saham",
                merchant: "Platform Investra",
                category: "Investasi",
                type: "expense",
                method: "transfer",
            },

            // FEBRUARY 2026
            {
                date: "2026-02-01",
                amount: 5000000,
                description: "Gaji Rutin Februari",
                merchant: "PT Tech Solutions",
                category: "Gaji",
                type: "income",
                method: "transfer",
            },
            {
                date: "2026-02-02",
                amount: 1500000,
                description: "Bayar Sewa Kosan",
                merchant: "Tuan Rumah",
                category: "Tagihan",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-02-03",
                amount: 32000,
                description: "Sarapan Nasi Kuning",
                merchant: "Warung Mak Ros",
                category: "Makan & Minuman",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-02-04",
                amount: 45000,
                description: "Gojek Food - Soto Ayam",
                merchant: "Gojek",
                category: "Makan & Minuman",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-02-05",
                amount: 150000,
                description: "Netflix Premium",
                merchant: "Netflix",
                category: "Hiburan",
                type: "expense",
                method: "gopay",
                recurring: true,
            },
            {
                date: "2026-02-06",
                amount: 40000,
                description: "Grab Ride",
                merchant: "Grab",
                category: "Transportasi",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-02-08",
                amount: 85000,
                description: "Potong Rambut + Cukur",
                merchant: "Barber Shop",
                category: "Kesehatan",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-02-10",
                amount: 175000,
                description: "Spotify Family",
                merchant: "Spotify",
                category: "Hiburan",
                type: "expense",
                method: "gopay",
                recurring: true,
            },
            {
                date: "2026-02-12",
                amount: 920000,
                description: "Belanja Online - Pakaian",
                merchant: "Shopee",
                category: "Belanja",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-02-15",
                amount: 130000,
                description: "Bensin Penuh Tank",
                merchant: "Pertamina",
                category: "Transportasi",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-02-18",
                amount: 280000,
                description: "Makan & Karaoke Bareng Teman",
                merchant: "Karaoke OK",
                category: "Hiburan",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-02-20",
                amount: 1500000,
                description: "Project Freelance - Mobile App UI",
                merchant: "Client C",
                category: "Freelance",
                type: "income",
                method: "transfer",
            },
            {
                date: "2026-02-22",
                amount: 600000,
                description: "Cicilan Laptop",
                merchant: "Bank BCA",
                category: "Transfer",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-02-24",
                amount: 250000,
                description: "Beli Keyboard Mekanik",
                merchant: "Lazada",
                category: "Belanja",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-02-26",
                amount: 500000,
                description: "Investasi Saham",
                merchant: "Platform Investra",
                category: "Investasi",
                type: "expense",
                method: "transfer",
            },

            // MARCH 2026
            {
                date: "2026-03-01",
                amount: 5000000,
                description: "Gaji Rutin Maret",
                merchant: "PT Tech Solutions",
                category: "Gaji",
                type: "income",
                method: "transfer",
            },
            {
                date: "2026-03-02",
                amount: 1500000,
                description: "Bayar Sewa Kosan",
                merchant: "Tuan Rumah",
                category: "Tagihan",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-03-03",
                amount: 28000,
                description: "Kopi Susu + Donat",
                merchant: "Dunkin Donuts",
                category: "Makan & Minuman",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-03-04",
                amount: 75000,
                description: "Lunch - Steak & Nasi",
                merchant: "Beef Station",
                category: "Makan & Minuman",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-03-05",
                amount: 150000,
                description: "Netflix Premium",
                merchant: "Netflix",
                category: "Hiburan",
                type: "expense",
                method: "gopay",
                recurring: true,
            },
            {
                date: "2026-03-06",
                amount: 48000,
                description: "Grab ke Kantor",
                merchant: "Grab",
                category: "Transportasi",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-03-08",
                amount: 175000,
                description: "Spotify Family",
                merchant: "Spotify",
                category: "Hiburan",
                type: "expense",
                method: "gopay",
                recurring: true,
            },
            {
                date: "2026-03-10",
                amount: 1200000,
                description: "Belanja Bulanan",
                merchant: "Alfamart",
                category: "Belanja",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-03-12",
                amount: 140000,
                description: "Bensin Penuh",
                merchant: "Shell",
                category: "Transportasi",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-03-15",
                amount: 110000,
                description: "Perawatan Kesehatan - Dokter",
                merchant: "Klinik Kesehatan",
                category: "Kesehatan",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-03-18",
                amount: 420000,
                description: "Beli Mouse Gaming + Mousepad",
                merchant: "Tokopedia",
                category: "Belanja",
                type: "expense",
                method: "gopay",
            },
            {
                date: "2026-03-20",
                amount: 520000,
                description: "Dinner dengan Keluarga",
                merchant: "Restoran Padang",
                category: "Makan & Minuman",
                type: "expense",
                method: "cash",
            },
            {
                date: "2026-03-22",
                amount: 2500000,
                description: "Project Freelance - Full Stack Dev",
                merchant: "Client D",
                category: "Freelance",
                type: "income",
                method: "transfer",
            },
            {
                date: "2026-03-24",
                amount: 600000,
                description: "Cicilan Laptop",
                merchant: "Bank BCA",
                category: "Transfer",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-03-26",
                amount: 750000,
                description: "Investasi Saham",
                merchant: "Platform Investra",
                category: "Investasi",
                type: "expense",
                method: "transfer",
            },
            {
                date: "2026-03-28",
                amount: 1000000,
                description: "Tabungan Darurat",
                merchant: "Tabungan Pribadi",
                category: "Tabungan",
                type: "expense",
                method: "transfer",
            },
        ];

        const transactionInserts = transactions_data.map((t) => ({
            userId,
            amount: t.amount,
            description: t.description,
            merchantName: t.merchant,
            categoryId: getCatId(t.category),
            type: t.type,
            paymentMethod: t.method,
            date: new Date(t.date),
            isVerified: true,
            isRecurring: t.recurring || false,
            createdAt: new Date(),
        }));

        db.insert(transactions).values(transactionInserts);
        console.log(`✅ Created ${transactionInserts.length} transactions`);

        // 4. Create Budgets for 3 months
        const budgetEntries = [];
        for (let month = 1; month <= 3; month++) {
            const budgetData_arr = [
                {
                    userId,
                    categoryId: getCatId("Makan & Minuman"),
                    amount: 2000000,
                    month,
                    year: 2026,
                },
                {
                    userId,
                    categoryId: getCatId("Transportasi"),
                    amount: 700000,
                    month,
                    year: 2026,
                },
                {
                    userId,
                    categoryId: getCatId("Hiburan"),
                    amount: 600000,
                    month,
                    year: 2026,
                },
                {
                    userId,
                    categoryId: getCatId("Belanja"),
                    amount: 1500000,
                    month,
                    year: 2026,
                },
                {
                    userId,
                    categoryId: getCatId("Kesehatan"),
                    amount: 400000,
                    month,
                    year: 2026,
                },
                {
                    userId,
                    categoryId: getCatId("Tagihan"),
                    amount: 2000000,
                    month,
                    year: 2026,
                },
                {
                    userId,
                    categoryId: getCatId("Investasi"),
                    amount: 500000,
                    month,
                    year: 2026,
                },
            ];
            budgetEntries.push(...budgetData_arr);
        }

        db.insert(budgets).values(budgetEntries);
        console.log(`✅ Created ${budgetEntries.length} budget entries`);

        // 5. Create Financial Goals
        const goalsData = [
            {
                userId,
                name: "MacBook Pro M3",
                targetAmount: 25000000,
                currentAmount: 8500000,
                deadline: new Date("2026-06-30"),
                icon: "Laptop",
                color: "#3b82f6",
            },
            {
                userId,
                name: "Emergency Fund 10 Juta",
                targetAmount: 10000000,
                currentAmount: 4500000,
                deadline: new Date("2026-12-31"),
                icon: "Shield",
                color: "#22c55e",
            },
            {
                userId,
                name: "Liburan ke Bali",
                targetAmount: 8000000,
                currentAmount: 2000000,
                deadline: new Date("2026-07-31"),
                icon: "Plane",
                color: "#f97316",
            },
            {
                userId,
                name: "iPhone 16 Pro Max",
                targetAmount: 18000000,
                currentAmount: 5200000,
                deadline: new Date("2026-08-31"),
                icon: "Smartphone",
                color: "#a855f7",
            },
            {
                userId,
                name: "Motor NMAX 2026",
                targetAmount: 35000000,
                currentAmount: 12000000,
                deadline: new Date("2026-10-31"),
                icon: "Bike",
                color: "#ec4899",
            },
        ];

        db.insert(goals).values(goalsData);
        console.log(`✅ Created ${goalsData.length} financial goals`);

        // 6. Create User Settings
        db.insert(userSettings).values({
            userId,
            hourlyRate: 100000,
            isAppLockEnabled: false,
            isBiometricEnabled: false,
            hideBalance: false,
            notificationsEnabled: true,
            hasCompletedOnboarding: true,
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
            quietHoursEnd: "08:00",
            autoLockTimeout: 300000,
            monthlyReportEmail: true,
            monthlyReportTelegram: false,
            weeklyInsightTelegram: false,
            reportLocale: "id",
            updatedAt: new Date(),
        });

        console.log("✅ Created user settings");

        console.log("\n📊 Seeding Summary:");
        console.log("================");
        console.log("✅ Admin User Created");
        console.log("   Email: admin@monev.app");
        console.log("   Password: admin123456");
        console.log("   Name: Budi Santoso (Anak Kosan Rantau)");
        console.log(`✅ 16 Categories Created`);
        console.log(
            `✅ ${transactionInserts.length} Transactions (3 months data)`
        );
        console.log(`✅ ${budgetEntries.length} Budget Entries (7 categories × 3 months)`);
        console.log(`✅ ${goalsData.length} Financial Goals`);
        console.log(`✅ User Settings Configured`);
        console.log("================\n");
        console.log("🎉 Admin account seeding completed successfully!");
        console.log(
            "You can now login with admin@monev.app / admin123456\n"
        );
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
}

seedAdminData();
