import { getDb } from "@/backend/db";
import { recurringSuggestionStates, recurringTransactions } from "@/backend/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export type CreateRecurringInput = {
    amount: number;
    description: string;
    categoryId?: number | null;
    type: "expense" | "income";
    frequency: "daily" | "weekly" | "monthly";
    nextRunAt: Date;
};

export async function getRecurringTransactions(userId: number) {
    const db = getDb();
    return db.select()
        .from(recurringTransactions)
        .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.isActive, true)))
        .orderBy(desc(recurringTransactions.createdAt))
        .all();
}

export async function createRecurringTransaction(userId: number, input: CreateRecurringInput) {
    const db = getDb();
    return db.insert(recurringTransactions).values({
        userId,
        amount: input.amount,
        description: input.description,
        categoryId: input.categoryId || null,
        type: input.type,
        frequency: input.frequency,
        nextRunAt: input.nextRunAt,
        isActive: true,
        createdAt: new Date(),
    }).returning().get();
}

export async function getRecurringSuggestionStateMap(userId: number, patternKeys: string[]) {
    if (patternKeys.length === 0) return new Map<string, "dismissed" | "accepted">();

    const db = getDb();
    const rows = db.select()
        .from(recurringSuggestionStates)
        .where(and(
            eq(recurringSuggestionStates.userId, userId),
            inArray(recurringSuggestionStates.patternKey, patternKeys)
        ))
        .all();

    return new Map(rows.map(row => [row.patternKey, row.status as "dismissed" | "accepted"]));
}

export async function upsertRecurringSuggestionState(
    userId: number,
    patternKey: string,
    status: "dismissed" | "accepted"
) {
    const db = getDb();
    return db.insert(recurringSuggestionStates).values({
        userId,
        patternKey,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).onConflictDoUpdate({
        target: [recurringSuggestionStates.userId, recurringSuggestionStates.patternKey],
        set: { status, updatedAt: new Date() },
    }).returning().get();
}
