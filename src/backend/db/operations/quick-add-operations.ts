import { getDb } from "@/backend/db";
import { accounts, categories, quickAddShortcuts, transactions } from "@/backend/db/schema";
import { createTransaction } from "./transaction-operations";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export type QuickAddShortcutInput = {
    label: string;
    amount: number;
    type: "expense" | "income";
    categoryId: number;
    accountId: number;
    merchantName?: string;
    paymentMethod?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
};

export async function getQuickAddShortcuts(userId: number) {
    const db = getDb();
    return db.select()
        .from(quickAddShortcuts)
        .where(and(eq(quickAddShortcuts.userId, userId), eq(quickAddShortcuts.isActive, true)))
        .orderBy(quickAddShortcuts.sortOrder, desc(quickAddShortcuts.usageCount))
        .all();
}

export async function createQuickAddShortcut(userId: number, input: QuickAddShortcutInput) {
    const db = getDb();
    return db.insert(quickAddShortcuts).values({
        userId,
        label: input.label.trim(),
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        accountId: input.accountId,
        merchantName: input.merchantName || input.label,
        paymentMethod: input.paymentMethod || "cash",
        icon: input.icon || "Zap",
        color: input.color || "#0ea5e9",
        sortOrder: input.sortOrder || 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning().get();
}

export async function updateQuickAddShortcut(userId: number, id: number, input: Partial<QuickAddShortcutInput> & { isActive?: boolean }) {
    const db = getDb();
    return db.update(quickAddShortcuts)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(quickAddShortcuts.userId, userId), eq(quickAddShortcuts.id, id)))
        .returning()
        .get();
}

export async function runQuickAddShortcut(userId: number, id: number) {
    const db = getDb();
    const shortcut = await db.select()
        .from(quickAddShortcuts)
        .where(and(
            eq(quickAddShortcuts.userId, userId),
            eq(quickAddShortcuts.id, id),
            eq(quickAddShortcuts.isActive, true)
        ))
        .get();

    if (!shortcut || !shortcut.categoryId || !shortcut.accountId) {
        return null;
    }

    const transaction = await createTransaction(userId, {
        amount: shortcut.amount,
        description: shortcut.label,
        merchantName: shortcut.merchantName || shortcut.label,
        categoryId: shortcut.categoryId,
        type: shortcut.type,
        paymentMethod: shortcut.paymentMethod || "cash",
        accountId: shortcut.accountId,
        date: new Date(),
    });

    await db.update(quickAddShortcuts)
        .set({
            usageCount: sql`${quickAddShortcuts.usageCount} + 1`,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(quickAddShortcuts.id, id));

    return transaction;
}


export async function getQuickAddSuggestions(userId: number) {
    const db = getDb();
    const since = new Date();
    since.setDate(since.getDate() - 45);

    const existing = await db.select({
        categoryId: quickAddShortcuts.categoryId,
        accountId: quickAddShortcuts.accountId,
        label: quickAddShortcuts.label,
    })
        .from(quickAddShortcuts)
        .where(and(eq(quickAddShortcuts.userId, userId), eq(quickAddShortcuts.isActive, true)))
        .all();

    const existingKeys = new Set(existing.map((item) => `${item.label}|${item.categoryId}|${item.accountId}`));

    const frequent = await db.select({
        label: sql<string>`COALESCE(${transactions.merchantName}, ${transactions.description})`,
        amount: sql<number>`ROUND(AVG(${transactions.amount}))`,
        type: transactions.type,
        categoryId: transactions.categoryId,
        accountId: transactions.accountId,
        categoryName: categories.name,
        accountName: accounts.name,
        count: sql<number>`COUNT(*)`,
        lastUsedAt: sql<Date>`MAX(${transactions.date})`,
    })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, since)
        ))
        .groupBy(transactions.merchantName, transactions.description, transactions.categoryId, transactions.accountId, transactions.type)
        .having(sql`COUNT(*) >= 2`)
        .orderBy(sql`COUNT(*) DESC`, sql`MAX(${transactions.date}) DESC`)
        .limit(6)
        .all();

    return frequent
        .filter((item) => item.categoryId && item.accountId && !existingKeys.has(`${item.label}|${item.categoryId}|${item.accountId}`))
        .map((item) => ({
            label: item.label,
            amount: Number(item.amount || 0),
            type: item.type === "income" ? "income" : "expense",
            categoryId: Number(item.categoryId),
            accountId: Number(item.accountId),
            categoryName: item.categoryName,
            accountName: item.accountName,
            count: Number(item.count || 0),
            merchantName: item.label,
            confidence: Math.min(95, 55 + Number(item.count || 0) * 10),
        }));
}
