import { getDb } from "../index";
import { debts } from "../schema";
import type { Debt } from "../schema";
import { eq, and, desc } from "drizzle-orm";

// Debts / Create Split Bill
export async function createDebt(data: {
    userId: number;
    debtorName: string;
    amount: number;
    description: string;
    dueDate?: Date;
}): Promise<Debt> {
    const db = getDb();
    return db.insert(debts).values(data).returning().get();
}

export async function getDebts(userId: number, status: "paid" | "unpaid" = "unpaid"): Promise<Debt[]> {
    const db = getDb();
    return db.select()
        .from(debts)
        .where(and(
            eq(debts.userId, userId),
            eq(debts.status, status)
        ))
        .orderBy(desc(debts.createdAt))
        .all();
}

export async function updateDebtStatus(userId: number, id: number, status: "paid" | "unpaid"): Promise<Debt | undefined> {
    const db = getDb();
    return db.update(debts)
        .set({ status })
        .where(and(eq(debts.id, id), eq(debts.userId, userId)))
        .returning()
        .get();
}
