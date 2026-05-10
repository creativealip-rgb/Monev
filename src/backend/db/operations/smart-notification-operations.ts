import { getDb } from "@/backend/db";
import { budgets, categories, notificationLogs, smartNotificationRules, transactions } from "@/backend/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

type RuleInput = {
    type: "anomaly_spending" | "budget_warning" | "positive_reinforcement" | "weekly_recap";
    title: string;
    body: string;
    severity?: "info" | "warning" | "critical";
    metadata?: Record<string, unknown>;
};

const formatRupiah = (amount: number) => `Rp${Math.round(amount).toLocaleString("id-ID")}`;

async function createRule(userId: number, rule: RuleInput) {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.select()
        .from(smartNotificationRules)
        .where(and(
            eq(smartNotificationRules.userId, userId),
            eq(smartNotificationRules.type, rule.type),
            eq(smartNotificationRules.status, "pending"),
            gte(smartNotificationRules.createdAt, today)
        ))
        .get();

    if (existing) {
        return existing;
    }

    return db.insert(smartNotificationRules).values({
        userId,
        type: rule.type,
        title: rule.title,
        body: rule.body,
        severity: rule.severity || "info",
        metadata: rule.metadata || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning().get();
}

export async function generateSmartNotifications(userId: number) {
    const db = getDb();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const created = [];

    const monthlyExpenses = await db.select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, monthStart)
        ))
        .get();

    const weeklyExpenses = await db.select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, weekStart)
        ))
        .get();

    const biggestToday = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, new Date(now.getFullYear(), now.getMonth(), now.getDate()))
        ))
        .orderBy(desc(transactions.amount))
        .limit(1)
        .get();

    const weeklyTotal = Number(weeklyExpenses?.total || 0);
    const monthlyTotal = Number(monthlyExpenses?.total || 0);

    if (biggestToday && weeklyTotal > 0 && biggestToday.amount > weeklyTotal / 7 * 2.5) {
        created.push(await createRule(userId, {
            type: "anomaly_spending",
            title: "Pengeluaran tidak biasa terdeteksi",
            body: `${biggestToday.description} sebesar ${formatRupiah(biggestToday.amount)} lebih tinggi dari pola mingguanmu.`,
            severity: "warning",
            metadata: { transactionId: biggestToday.id, amount: biggestToday.amount },
        }));
    }

    const currentBudgets = await db.select({ budget: budgets, category: categories })
        .from(budgets)
        .leftJoin(categories, eq(budgets.categoryId, categories.id))
        .where(and(
            eq(budgets.userId, userId),
            eq(budgets.month, now.getMonth() + 1),
            eq(budgets.year, now.getFullYear())
        ))
        .all();

    for (const row of currentBudgets) {
        if (row.budget.amount <= 0) continue;
        const usage = row.budget.spent / row.budget.amount;
        if (usage >= 0.8) {
            created.push(await createRule(userId, {
                type: "budget_warning",
                title: "Budget hampir habis",
                body: `${row.category?.name || "Kategori"} sudah terpakai ${Math.round(usage * 100)}% dari budget ${formatRupiah(row.budget.amount)}.`,
                severity: usage >= 1 ? "critical" : "warning",
                metadata: { budgetId: row.budget.id, categoryId: row.budget.categoryId, usage },
            }));
            break;
        }
    }

    if (weeklyTotal === 0 && monthlyTotal > 0) {
        created.push(await createRule(userId, {
            type: "positive_reinforcement",
            title: "Minggu ini hemat banget",
            body: "Belum ada pengeluaran 7 hari terakhir. Pertahankan ritmenya!",
            severity: "info",
            metadata: { weeklyTotal, monthlyTotal },
        }));
    }

    created.push(await createRule(userId, {
        type: "weekly_recap",
        title: "Rekap mingguan siap",
        body: `7 hari terakhir kamu mencatat pengeluaran ${formatRupiah(weeklyTotal)}.`,
        severity: "info",
        metadata: { weeklyTotal, monthlyTotal },
    }));

    return created.filter(Boolean);
}

export async function getSmartNotifications(userId: number, limit = 20) {
    const db = getDb();
    return db.select()
        .from(smartNotificationRules)
        .where(eq(smartNotificationRules.userId, userId))
        .orderBy(desc(smartNotificationRules.createdAt))
        .limit(limit)
        .all();
}

export async function dismissSmartNotification(userId: number, id: number) {
    const db = getDb();
    return db.update(smartNotificationRules)
        .set({ status: "dismissed", updatedAt: new Date() })
        .where(and(eq(smartNotificationRules.userId, userId), eq(smartNotificationRules.id, id)))
        .returning()
        .get();
}

export async function logSmartNotificationAsRead(userId: number, ruleId: number) {
    const db = getDb();
    const rule = await db.select()
        .from(smartNotificationRules)
        .where(and(eq(smartNotificationRules.userId, userId), eq(smartNotificationRules.id, ruleId)))
        .get();

    if (!rule) return null;

    return db.insert(notificationLogs).values({
        userId,
        type: rule.type === "budget_warning" ? "budget_alert" : "custom",
        title: rule.title,
        body: rule.body,
        status: "sent",
        isRead: false,
        createdAt: new Date(),
    }).returning().get();
}
