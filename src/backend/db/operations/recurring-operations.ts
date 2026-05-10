import { getDb } from "@/backend/db";
import { recurringTransactions } from "@/backend/db/schema";
import { and, desc, eq } from "drizzle-orm";

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
