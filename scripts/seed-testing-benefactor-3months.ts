import { createRequire } from "node:module";
import * as bcryptjs from "bcryptjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3") as typeof import("better-sqlite3");
const db = new Database(process.env.DATABASE_URL || "sqlite.db");
db.pragma("journal_mode = WAL");

const EMAIL = "testing@monev.app";
const PASSWORD = "testing123456";

const expenseCategories = [
    ["Makan & Minuman", "#f97316", "Utensils"],
    ["Transportasi", "#3b82f6", "Car"],
    ["Belanja", "#ec4899", "ShoppingBag"],
    ["Tagihan", "#ef4444", "Receipt"],
    ["Hiburan", "#a855f7", "Gamepad2"],
    ["Kesehatan", "#22c55e", "Heart"],
    ["Tabungan", "#0ea5e9", "PiggyBank"],
    ["Investasi", "#10b981", "TrendingUp"],
    ["Pendidikan", "#14b8a6", "BookOpen"],
    ["Lainnya", "#64748b", "MoreHorizontal"],
] as const;

const incomeCategories = [
    ["Gaji", "#16a34a", "Banknote"],
    ["Freelance", "#8b5cf6", "Briefcase"],
] as const;

function dayAt(offset: number, hour = 9, minute = 0) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    date.setDate(date.getDate() + offset);
    return date;
}

function dateTs(date: Date) {
    return Math.floor(date.getTime() / 1000);
}

function nowTs() {
    return dateTs(new Date());
}

function monthKey(date: Date) {
    return { month: date.getMonth() + 1, year: date.getFullYear() };
}

function rupiah(base: number, variance = 0) {
    return Math.round((base + variance) / 500) * 500;
}

function ensureCategory(name: string, color: string, icon: string, type: "expense" | "income") {
    const existing = db.prepare("SELECT id FROM categories WHERE user_id IS NULL AND name = ? AND type = ?").get(name, type) as { id: number } | undefined;
    if (existing) return existing.id;
    const info = db.prepare("INSERT INTO categories (user_id, name, color, icon, type, created_at) VALUES (NULL, ?, ?, ?, ?, ?)")
        .run(name, color, icon, type, nowTs());
    return Number(info.lastInsertRowid);
}

function tableExists(name: string) {
    return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
}

function cleanupUser(userId: number) {
    const tables = [
        "bill_payments",
        "transactions",
        "budgets",
        "goals",
        "bills",
        "debts",
        "investments",
        "recurring_transactions",
        "recurring_suggestion_states",
        "sync_queue",
        "sync_conflicts",
        "user_settings",
        "accounts",
    ];

    for (const table of tables) {
        if (tableExists(table)) {
            db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId);
        }
    }
}

const run = db.transaction(() => {
    const password = bcryptjs.hashSync(PASSWORD, 10);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(EMAIL) as { id: number } | undefined;
    let userId: number;

    if (existing) {
        userId = existing.id;
        db.prepare(`
            UPDATE users
            SET password = ?, name = ?, username = ?, first_name = ?, last_name = ?, tier = ?, tier_expires_at = ?,
                is_admin = 0, is_active = 1, email_verified = ?, onboarding_version = ?, onboarding_path = ?,
                demo_data_loaded = 1, demo_data_scope = ?
            WHERE id = ?
        `).run(password, "Akun Testing Benefactor", "testing_benefactor", "Testing", "Benefactor", "benefactor", dateTs(expiresAt), nowTs(), "v2", "complete", "complete", userId);
        cleanupUser(userId);
    } else {
        const info = db.prepare(`
            INSERT INTO users (email, password, name, username, first_name, last_name, tier, tier_expires_at, is_admin,
                is_active, email_verified, onboarding_version, onboarding_path, demo_data_loaded, demo_data_scope, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, 1, ?, ?)
        `).run(EMAIL, password, "Akun Testing Benefactor", "testing_benefactor", "Testing", "Benefactor", "benefactor", dateTs(expiresAt), nowTs(), "v2", "complete", "complete", nowTs());
        userId = Number(info.lastInsertRowid);
    }

    const categoryIds: Record<string, number> = {};
    for (const [name, color, icon] of expenseCategories) categoryIds[name] = ensureCategory(name, color, icon, "expense");
    for (const [name, color, icon] of incomeCategories) categoryIds[name] = ensureCategory(name, color, icon, "income");

    const accountInsert = db.prepare("INSERT INTO accounts (user_id, name, type, balance, color, icon, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)");
    const accounts = [
        ["BCA Payroll", "bank", 18500000, "#2563eb", "Building2"],
        ["Mandiri Operasional", "bank", 8200000, "#f59e0b", "Landmark"],
        ["GoPay", "emoney", 925000, "#00aed8", "Wallet"],
        ["Cash", "cash", 1350000, "#22c55e", "Banknote"],
        ["Bibit", "investment_wallet", 12750000, "#10b981", "TrendingUp"],
    ];
    const accountIds: Record<string, number> = {};
    for (const account of accounts) {
        const info = accountInsert.run(userId, ...account, nowTs(), nowTs());
        accountIds[String(account[0])] = Number(info.lastInsertRowid);
    }

    const settingsInfo = db.prepare(`
        INSERT INTO user_settings (user_id, hourly_rate, monthly_income, notifications_enabled, has_completed_onboarding,
            financial_persona, persona_updated_at, daily_report, budget_alert, transaction_update, bill_reminder,
            goal_progress, push_enabled, email_enabled, report_locale, updated_at)
        VALUES (?, ?, ?, 1, 1, ?, ?, 1, 1, 1, 1, 1, 1, 1, 'id', ?)
    `).run(userId, 125000, 18500000, "Balanced Builder - disiplin menabung, aktif investasi, masih punya ruang optimasi belanja harian.", nowTs(), nowTs());

    const goalInsert = db.prepare("INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const goalEmergency = Number(goalInsert.run(userId, "Dana Darurat 6 Bulan", 90000000, 41500000, dateTs(dayAt(210)), "Shield", "#22c55e", nowTs()).lastInsertRowid);
    goalInsert.run(userId, "DP Rumah", 250000000, 68500000, dateTs(dayAt(540)), "Home", "#3b82f6", nowTs());
    goalInsert.run(userId, "Liburan Jepang", 55000000, 17300000, dateTs(dayAt(320)), "Plane", "#f97316", nowTs());

    const billInsert = db.prepare("INSERT INTO bills (user_id, name, amount, category_id, due_date, frequency, is_paid, last_paid_at, icon, color, is_active, is_subscription, notes, created_at) VALUES (?, ?, ?, ?, ?, 'monthly', ?, ?, ?, ?, 1, ?, ?, ?)");
    const billData = [
        ["Internet Rumah", 429000, 15, "Wifi", "#3b82f6", 1],
        ["Listrik PLN", 650000, 20, "Zap", "#f59e0b", 0],
        ["Netflix", 186000, 5, "Tv", "#ef4444", 1],
        ["Asuransi Kesehatan", 850000, 10, "HeartPulse", "#22c55e", 0],
    ];
    for (const bill of billData) {
        billInsert.run(userId, bill[0], bill[1], categoryIds[bill[0] === "Netflix" ? "Hiburan" : "Tagihan"], bill[2], 1, dateTs(dayAt(-10)), bill[3], bill[4], bill[5], "Dummy testing 3 bulan", nowTs());
    }

    const budgetPlans = [
        ["Makan & Minuman", 4500000],
        ["Transportasi", 1800000],
        ["Belanja", 2500000],
        ["Tagihan", 3200000],
        ["Hiburan", 1200000],
        ["Kesehatan", 1100000],
        ["Tabungan", 5000000],
        ["Investasi", 4500000],
    ];
    const budgetInsert = db.prepare("INSERT INTO budgets (user_id, category_id, amount, spent, month, year, enable_rollover, created_at) VALUES (?, ?, ?, 0, ?, ?, 1, ?)");
    for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
        const base = new Date();
        base.setMonth(base.getMonth() + monthOffset, 1);
        const { month, year } = monthKey(base);
        for (const [name, amount] of budgetPlans) {
            budgetInsert.run(userId, categoryIds[String(name)], amount, month, year, nowTs());
        }
    }

    const txInsert = db.prepare(`
        INSERT INTO transactions (user_id, amount, description, merchant_name, category_id, type, payment_method,
            destination_type, destination_id, account_id, target_account_id, date, is_verified, is_recurring, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const dailyMerchants = [
        ["Kopi Kenangan", "Makan & Minuman", 28000],
        ["Warung Padang Sederhana", "Makan & Minuman", 42000],
        ["GrabBike", "Transportasi", 23000],
        ["TransJakarta", "Transportasi", 7000],
        ["Alfamart", "Belanja", 68000],
        ["Tokopedia", "Belanja", 185000],
        ["Bioskop CGV", "Hiburan", 95000],
        ["Apotek K24", "Kesehatan", 72000],
    ] as const;

    let transactionCount = 0;
    for (let offset = -89; offset <= 0; offset++) {
        const date = dayAt(offset, 8, 30);
        const day = date.getDate();
        const weekday = date.getDay();
        const pick = Math.abs(offset) % dailyMerchants.length;
        const [merchant, category, baseAmount] = dailyMerchants[pick];
        const account = pick % 3 === 0 ? "GoPay" : pick % 3 === 1 ? "BCA Payroll" : "Mandiri Operasional";

        txInsert.run(userId, rupiah(baseAmount, (day % 5) * 3500), `${merchant} harian`, merchant, categoryIds[category], "expense", account.includes("GoPay") ? "emoney" : "debit", null, null, accountIds[account], null, dateTs(date), 0, nowTs());
        transactionCount++;

        if (weekday === 6) {
            txInsert.run(userId, rupiah(325000, day * 2500), "Belanja groceries mingguan", "Super Indo", categoryIds["Belanja"], "expense", "debit", null, null, accountIds["BCA Payroll"], null, dateTs(dayAt(offset, 16)), 0, nowTs());
            transactionCount++;
        }

        if (day === 25) {
            txInsert.run(userId, 18500000, "Gaji bulanan", "PT Nusantara Digital", categoryIds["Gaji"], "income", "bank", null, null, accountIds["BCA Payroll"], null, dateTs(dayAt(offset, 9)), 1, nowTs());
            txInsert.run(userId, 4500000, "Investasi rutin reksadana", "Bibit", categoryIds["Investasi"], "expense", "transfer", "investment", null, accountIds["BCA Payroll"], accountIds["Bibit"], dateTs(dayAt(offset, 10)), 1, nowTs());
            txInsert.run(userId, 3000000, "Setoran dana darurat", "Monev Goals", categoryIds["Tabungan"], "expense", "transfer", "goal", goalEmergency, accountIds["BCA Payroll"], null, dateTs(dayAt(offset, 11)), 1, nowTs());
            transactionCount += 3;
        }

        if (day === 7 || day === 18) {
            txInsert.run(userId, rupiah(1750000, day * 50000), "Project freelance landing page", "Client Freelance", categoryIds["Freelance"], "income", "bank", null, null, accountIds["Mandiri Operasional"], null, dateTs(dayAt(offset, 14)), 0, nowTs());
            transactionCount++;
        }

        if ([5, 10, 15, 20].includes(day)) {
            const billAmount = day === 5 ? 186000 : day === 10 ? 850000 : day === 15 ? 429000 : 650000;
            const billName = day === 5 ? "Netflix" : day === 10 ? "Asuransi Kesehatan" : day === 15 ? "Internet Rumah" : "Listrik PLN";
            txInsert.run(userId, billAmount, `Bayar ${billName}`, billName, categoryIds[day === 5 ? "Hiburan" : "Tagihan"], "expense", "autodebit", "bill", null, accountIds["BCA Payroll"], null, dateTs(dayAt(offset, 12)), 1, nowTs());
            transactionCount++;
        }
    }

    const investInsert = db.prepare("INSERT INTO investments (user_id, name, type, quantity, avg_buy_price, current_price, platform, icon, color, notes, total_dividends, realized_profit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    investInsert.run(userId, "Reksadana Pasar Uang", "mutual_fund", 1250, 10000, 10450, "Bibit", "LineChart", "#10b981", "Portofolio stabil untuk dana parkir", 0, 0, nowTs(), nowTs());
    investInsert.run(userId, "BBCA", "stock", 420, 9100, 9850, "Stockbit", "TrendingUp", "#2563eb", "Saham core banking", 185000, 320000, nowTs(), nowTs());
    investInsert.run(userId, "Emas Antam", "gold", 8.5, 1180000, 1325000, "Pegadaian Digital", "Gem", "#f59e0b", "Hedge inflasi", 0, 0, nowTs(), nowTs());

    const debtInsert = db.prepare("INSERT INTO debts (user_id, debtor_name, amount, description, due_date, status, is_split_bill, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)");
    debtInsert.run(userId, "Raka", 750000, "Patungan staycation Bandung", dateTs(dayAt(14)), "unpaid", nowTs());
    debtInsert.run(userId, "Maya", 350000, "Talangan tiket konser", dateTs(dayAt(-12)), "paid", nowTs());

    const recurringInsert = db.prepare("INSERT INTO recurring_transactions (user_id, amount, description, category_id, account_id, type, frequency, next_run_at, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 'monthly', ?, 1, ?)");
    recurringInsert.run(userId, 18500000, "Gaji bulanan", categoryIds["Gaji"], accountIds["BCA Payroll"], "income", dateTs(dayAt(12)), nowTs());
    recurringInsert.run(userId, 429000, "Internet Rumah", categoryIds["Tagihan"], accountIds["BCA Payroll"], "expense", dateTs(dayAt(5)), nowTs());
    recurringInsert.run(userId, 4500000, "Investasi rutin", categoryIds["Investasi"], accountIds["BCA Payroll"], "expense", dateTs(dayAt(12)), nowTs());

    db.prepare("UPDATE user_settings SET primary_goal_id = ? WHERE id = ?").run(goalEmergency, Number(settingsInfo.lastInsertRowid));

    return { userId, transactionCount };
});

const result = run();
console.log("Testing account seeded successfully");
console.log("Email: [REDACTED]");
console.log("Password: [REDACTED]");
console.log("Tier: benefactor");
console.log(`User ID: ${result.userId}`);
console.log(`Transactions: ${result.transactionCount}`);
