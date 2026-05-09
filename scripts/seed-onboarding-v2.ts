import { getDb, demoDataTemplates, achievements } from "../src/backend/db";

async function seedOnboardingV2() {
  const db = getDb();
  console.log("🌱 Seeding Onboarding V2 data...");

  // Seed demo data templates
  console.log("📦 Seeding demo data templates...");
  
  const quickTemplate = {
    scope: "quick" as const,
    durationDays: 7,
    transactionCount: 15,
    templateData: JSON.stringify({
      accounts: [
        { name: "BCA Savings", type: "bank", balance: 5000000, currency: "IDR", icon: "Building2", color: "#0066CC" },
        { name: "GoPay", type: "emoney", balance: 500000, currency: "IDR", icon: "Smartphone", color: "#00AA13" }
      ],
      transactions: [
        { day: 1, description: "Gaji", amount: 8000000, type: "income", category: "Gaji", account: "BCA Savings" },
        { day: 1, description: "Indomaret", amount: -45000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 1, description: "Grab", amount: -25000, type: "expense", category: "Transport", account: "GoPay" },
        { day: 2, description: "Warteg", amount: -20000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 2, description: "Shopee", amount: -150000, type: "expense", category: "Belanja", account: "BCA Savings" },
        { day: 3, description: "Alfamart", amount: -35000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 3, description: "Bensin", amount: -100000, type: "expense", category: "Transport", account: "BCA Savings" },
        { day: 4, description: "Makan siang", amount: -30000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 4, description: "Netflix", amount: -54000, type: "expense", category: "Langganan", account: "BCA Savings" },
        { day: 5, description: "Kopi", amount: -25000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 5, description: "Parkir", amount: -5000, type: "expense", category: "Transport", account: "GoPay" },
        { day: 6, description: "Groceries", amount: -200000, type: "expense", category: "Makanan", account: "BCA Savings" },
        { day: 6, description: "Bioskop", amount: -50000, type: "expense", category: "Hiburan", account: "BCA Savings" },
        { day: 7, description: "Makan malam", amount: -75000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 7, description: "Transfer tabungan", amount: -500000, type: "expense", category: "Tabungan", account: "BCA Savings" }
      ],
      budgets: [
        { category: "Makanan", amount: 2000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
      ],
      bills: [],
      goals: [],
      recurring: []
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const standardTemplate = {
    scope: "standard" as const,
    durationDays: 30,
    transactionCount: 30,
    templateData: JSON.stringify({
      accounts: [
        { name: "BCA Savings", type: "bank", balance: 8000000, currency: "IDR", icon: "Building2", color: "#0066CC" },
        { name: "GoPay", type: "emoney", balance: 750000, currency: "IDR", icon: "Smartphone", color: "#00AA13" },
        { name: "Cash", type: "cash", balance: 300000, currency: "IDR", icon: "Wallet", color: "#10B981" }
      ],
      transactions: [
        { day: 1, description: "Gaji", amount: 8000000, type: "income", category: "Gaji", account: "BCA Savings" },
        { day: 2, description: "Indomaret", amount: -45000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 3, description: "Grab", amount: -35000, type: "expense", category: "Transport", account: "GoPay" },
        { day: 4, description: "Warteg", amount: -25000, type: "expense", category: "Makanan", account: "Cash" },
        { day: 5, description: "Shopee", amount: -250000, type: "expense", category: "Belanja", account: "BCA Savings" },
        { day: 6, description: "Bensin", amount: -150000, type: "expense", category: "Transport", account: "BCA Savings" },
        { day: 7, description: "Makan siang", amount: -40000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 8, description: "Netflix", amount: -54000, type: "expense", category: "Langganan", account: "BCA Savings" },
        { day: 9, description: "Kopi", amount: -30000, type: "expense", category: "Makanan", account: "Cash" },
        { day: 10, description: "Groceries", amount: -300000, type: "expense", category: "Makanan", account: "BCA Savings" },
        { day: 11, description: "Bioskop", amount: -75000, type: "expense", category: "Hiburan", account: "BCA Savings" },
        { day: 12, description: "Parkir", amount: -10000, type: "expense", category: "Transport", account: "Cash" },
        { day: 13, description: "Makan malam", amount: -80000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 14, description: "Transfer tabungan", amount: -1000000, type: "expense", category: "Tabungan", account: "BCA Savings" },
        { day: 15, description: "Alfamart", amount: -50000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 16, description: "Gojek", amount: -40000, type: "expense", category: "Transport", account: "GoPay" },
        { day: 17, description: "Tokopedia", amount: -180000, type: "expense", category: "Belanja", account: "BCA Savings" },
        { day: 18, description: "Bensin", amount: -150000, type: "expense", category: "Transport", account: "BCA Savings" },
        { day: 19, description: "Makan siang", amount: -35000, type: "expense", category: "Makanan", account: "Cash" },
        { day: 20, description: "Listrik", amount: -500000, type: "expense", category: "Tagihan", account: "BCA Savings" },
        { day: 21, description: "Kopi", amount: -28000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 22, description: "Groceries", amount: -280000, type: "expense", category: "Makanan", account: "BCA Savings" },
        { day: 23, description: "Spotify", amount: -54000, type: "expense", category: "Langganan", account: "BCA Savings" },
        { day: 24, description: "Parkir", amount: -8000, type: "expense", category: "Transport", account: "Cash" },
        { day: 25, description: "Internet", amount: -400000, type: "expense", category: "Tagihan", account: "BCA Savings" },
        { day: 26, description: "Makan malam", amount: -90000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 27, description: "Grab", amount: -45000, type: "expense", category: "Transport", account: "GoPay" },
        { day: 28, description: "Indomaret", amount: -55000, type: "expense", category: "Makanan", account: "GoPay" },
        { day: 29, description: "Bioskop", amount: -80000, type: "expense", category: "Hiburan", account: "BCA Savings" },
        { day: 30, description: "Transfer tabungan", amount: -500000, type: "expense", category: "Tabungan", account: "BCA Savings" }
      ],
      budgets: [
        { category: "Makanan", amount: 2000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Transport", amount: 1500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Hiburan", amount: 800000, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
      ],
      bills: [
        { name: "Listrik", amount: 500000, dueDate: 20 },
        { name: "Internet", amount: 400000, dueDate: 25 }
      ],
      goals: [],
      recurring: []
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const completeTemplate = {
    scope: "complete" as const,
    durationDays: 90,
    transactionCount: 50,
    templateData: JSON.stringify({
      accounts: [
        { name: "BCA Savings", type: "bank", balance: 12000000, currency: "IDR", icon: "Building2", color: "#0066CC" },
        { name: "Mandiri Checking", type: "bank", balance: 3000000, currency: "IDR", icon: "Building2", color: "#003D79" },
        { name: "GoPay", type: "emoney", balance: 1000000, currency: "IDR", icon: "Smartphone", color: "#00AA13" },
        { name: "OVO", type: "emoney", balance: 500000, currency: "IDR", icon: "Smartphone", color: "#4C3494" },
        { name: "Cash", type: "cash", balance: 500000, currency: "IDR", icon: "Wallet", color: "#10B981" }
      ],
      transactions: [], // 50+ transactions spread over 90 days
      budgets: [
        { category: "Makanan", amount: 2500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Transport", amount: 1500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Belanja", amount: 1200000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Hiburan", amount: 800000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Tagihan", amount: 1000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Langganan", amount: 400000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Kesehatan", amount: 500000, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        { category: "Tabungan", amount: 2000000, month: new Date().getMonth() + 1, year: new Date().getFullYear() }
      ],
      bills: [
        { name: "Listrik", amount: 600000, dueDate: 20 },
        { name: "Internet", amount: 500000, dueDate: 25 },
        { name: "Asuransi", amount: 800000, dueDate: 1 }
      ],
      goals: [
        { name: "Emergency Fund", targetAmount: 20000000, currentAmount: 5000000, icon: "Shield", color: "#EF4444" },
        { name: "Liburan Bali", targetAmount: 10000000, currentAmount: 2000000, icon: "Plane", color: "#3B82F6" }
      ],
      recurring: [
        { name: "Netflix", amount: 54000, frequency: "monthly", day: 1, category: "Langganan" },
        { name: "Spotify", amount: 54000, frequency: "monthly", day: 5, category: "Langganan" },
        { name: "Gym", amount: 300000, frequency: "monthly", day: 10, category: "Kesehatan" }
      ]
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.insert(demoDataTemplates).values([quickTemplate, standardTemplate, completeTemplate]);
  console.log("✅ Demo data templates seeded (3 templates)");

  // Seed achievements
  console.log("🏆 Seeding achievements...");
  
  const achievementsList = [
    {
      code: "onboarding_complete",
      name: "First Step",
      description: "You completed onboarding!",
      icon: "🏆",
      tier: "bronze" as const,
      points: 10,
      category: "onboarding" as const,
      createdAt: new Date()
    },
    {
      code: "demo_data_loaded",
      name: "Explorer",
      description: "You tried demo data!",
      icon: "🗺️",
      tier: "bronze" as const,
      points: 5,
      category: "onboarding" as const,
      createdAt: new Date()
    },
    {
      code: "budget_created",
      name: "Budget Master",
      description: "You created your first budget!",
      icon: "💰",
      tier: "bronze" as const,
      points: 15,
      category: "budget" as const,
      createdAt: new Date()
    },
    {
      code: "first_transaction",
      name: "First Transaction",
      description: "You recorded your first transaction!",
      icon: "📝",
      tier: "bronze" as const,
      points: 10,
      category: "transaction" as const,
      createdAt: new Date()
    },
    {
      code: "streak_7",
      name: "Week Warrior",
      description: "You logged in for 7 days straight!",
      icon: "🔥",
      tier: "silver" as const,
      points: 25,
      category: "streak" as const,
      createdAt: new Date()
    },
    {
      code: "goal_created",
      name: "Goal Setter",
      description: "You created your first savings goal!",
      icon: "🎯",
      tier: "bronze" as const,
      points: 15,
      category: "goal" as const,
      createdAt: new Date()
    }
  ];

  await db.insert(achievements).values(achievementsList);
  console.log("✅ Achievements seeded (6 achievements)");

  console.log("🎉 Onboarding V2 seed complete!");
}

seedOnboardingV2()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
