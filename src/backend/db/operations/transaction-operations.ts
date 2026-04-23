import { getDb } from "../index";
import { transactions, billPayments } from "../schema";
import type { Transaction } from "../schema";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { updateAccountBalance } from "../account-operations";
import { updateUserStreak, unlockAchievement } from "./gamification-operations";

export interface GetTransactionsOptions {
    limit?: number;
    offset?: number;
    search?: string;
    categoryId?: number;
    type?: "expense" | "income" | "all";
    startDate?: Date;
    endDate?: Date;
}

export async function getTransactions(userId: number, limit = 50, offset = 0, search?: string): Promise<Transaction[]> {
    const db = getDb();

    const conditions = [eq(transactions.userId, userId)];

    if (search) {
        conditions.push(
            sql`(${transactions.description} LIKE ${'%' + search + '%'} OR ${transactions.merchantName} LIKE ${'%' + search + '%'})`
        );
    }

    return db.select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .offset(offset)
        .all();
}

export interface SearchTransactionsOptions {
    limit?: number;
    offset?: number;
    search?: string;
    categoryId?: number;
    accountId?: number;
    type?: "expense" | "income" | "transfer" | "all";
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
}

export async function searchTransactions(userId: number, options: SearchTransactionsOptions): Promise<Transaction[]> {
    const db = getDb();
    const conditions = [eq(transactions.userId, userId)];

    if (options.search) {
        // Fix SQL Injection
        conditions.push(
            or(
                like(transactions.description, `%${options.search}%`),
                like(transactions.merchantName, `%${options.search}%`)
            ) as any
        );
    }

    if (options.categoryId) {
        conditions.push(eq(transactions.categoryId, options.categoryId));
    }

    if (options.accountId) {
        conditions.push(eq(transactions.accountId, options.accountId));
    }

    if (options.type && options.type !== "all") {
        conditions.push(eq(transactions.type, options.type));
    }

    if (options.startDate) {
        conditions.push(gte(transactions.date, options.startDate));
    }

    if (options.endDate) {
        conditions.push(lte(transactions.date, options.endDate));
    }

    if (options.minAmount !== undefined) {
        conditions.push(gte(transactions.amount, options.minAmount));
    }

    if (options.maxAmount !== undefined) {
        conditions.push(lte(transactions.amount, options.maxAmount));
    }

    return db.select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(options.limit || 50)
        .offset(options.offset || 0)
        .all();
}

// Get total transaction count (for pagination)
export async function getTransactionsCount(userId: number, search?: string): Promise<number> {
    const db = getDb();

    let query = db.select({ count: sql<number>`COUNT(*)` }).from(transactions).where(eq(transactions.userId, userId));

    if (search) {
        // Fix SQL Injection
        query = db.select({ count: sql<number>`COUNT(*)` })
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                or(
                    like(transactions.description, `%${search}%`),
                    like(transactions.merchantName, `%${search}%`)
                )
            ));
    }

    const result = await query.get();
    return result?.count || 0;
}

export async function getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, categoryId)
        ))
        .orderBy(desc(transactions.date))
        .all();
}

export async function getTransactionById(userId: number, id: number): Promise<Transaction | undefined> {
    const db = getDb();
    return db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).get();
}

export async function createBulkTransactions(userId: number, items: any[]): Promise<void> {
    const db = getDb();

    // Process in batches if necessary, but for small-medium CSVs, a single transaction is fine
    await db.transaction(async (tx) => {
        for (const data of items) {
            const amount = parseFloat(data.amount) || 0;
            const res = await tx.insert(transactions).values({
                userId,
                amount,
                description: data.description || "Imported Transaction",
                categoryId: data.categoryId || null,
                type: data.type || (amount >= 0 ? "income" : "expense"),
                date: new Date(data.date || Date.now()),
                paymentMethod: "cash",
                isVerified: true,
                isRecurring: false,
            }).returning().get();

            // Update Account Balance if accountId is provided (optional in import)
            if (res && data.accountId) {
                const amountChange = res.type === 'income' ? res.amount : -res.amount;
                // Since updateAccountBalance is outside and might use another db instance or transaction,
                // we should ideally have a version that works inside this transaction.
                // For now, we'll just insert the transactions and skip balance update or do it simply.
            }
        }
    });
}

export async function createTransaction(userId: number, data: {
    amount: number;
    description: string;
    merchantName?: string;
    categoryId: number;
    type: "expense" | "income" | "transfer";
    paymentMethod?: string;
    accountId?: number;
    targetAccountId?: number;
    date: Date;
}): Promise<Transaction> {
    const db = getDb();
    const result = db.insert(transactions).values({
        userId,
        ...data,
        isVerified: true,
        isRecurring: false,
    }).returning().get();

    // Update Account Balance
    if (result && data.accountId) {
        const amountChange = data.type === 'income' ? data.amount : -data.amount;
        await updateAccountBalance(userId, data.accountId, amountChange);

        // Handle target account for transfers
        if (data.type === 'transfer' && data.targetAccountId) {
            await updateAccountBalance(userId, data.targetAccountId, data.amount);
        }
    }

    // Trigger Gamification: Update Streak & First Transaction
    if (result) {
        await updateUserStreak(userId);
        await unlockAchievement(userId, "first_tx", "Pencatat Pemula", "Mencatat transaksi pertama kali! 📝");
    }

    return result;
}

export async function updateTransaction(userId: number, id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const db = getDb();

    // 1. Get old transaction to revert balance
    const oldTx = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).get();

    if (!oldTx) return undefined;

    // 2. Perform update
    const result = db.update(transactions)
        .set(data)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning()
        .get();

    if (result) {
        // 3. Revert old balance effect
        if (oldTx.accountId) {
            const oldReversal = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            await updateAccountBalance(userId, oldTx.accountId, oldReversal);

            if (oldTx.type === 'transfer' && oldTx.targetAccountId) {
                await updateAccountBalance(userId, oldTx.targetAccountId, -oldTx.amount);
            }
        }

        // 4. Apply new balance effect
        if (result.accountId) {
            const newChange = result.type === 'income' ? result.amount : -result.amount;
            await updateAccountBalance(userId, result.accountId, newChange);

            if (result.type === 'transfer' && result.targetAccountId) {
                await updateAccountBalance(userId, result.targetAccountId, result.amount);
            }
        }
    }

    return result;
}

export async function deleteTransaction(userId: number, id: number): Promise<void> {
    const db = getDb();

    // 1. Get transaction to revert balance
    const tx = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).get();

    if (tx) {
        // 2. Revert balance
        if (tx.accountId) {
            const reversal = tx.type === 'income' ? -tx.amount : tx.amount;
            await updateAccountBalance(userId, tx.accountId, reversal);

            if (tx.type === 'transfer' && tx.targetAccountId) {
                await updateAccountBalance(userId, tx.targetAccountId, -tx.amount);
            }
        }
    }

    // 3. Delete associated bill_payments records (if this transaction was a bill payment)
    await db.delete(billPayments)
        .where(and(
            eq(billPayments.transactionId, id),
            eq(billPayments.userId, userId)
        ));

    // 4. Delete the transaction
    await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function getRecentTransactionsByCategory(userId: number, categoryId: number, limit: number = 5): Promise<Transaction[]> {
    const db = getDb();
    return db.select()
        .from(transactions)
        .where(and(
            eq(transactions.categoryId, categoryId),
            eq(transactions.userId, userId)
        ))
        .orderBy(desc(transactions.date))
        .limit(limit)
        .all();
}

/**
 * Find a transaction that matches the amount but has opposite type
 * within a specific time window (default 5 minutes).
 */
export async function findRecentMatchingTransaction(
    userId: number,
    amount: number,
    type: "expense" | "income",
    windowMs: number = 300000 // 5 minutes
): Promise<Transaction | undefined> {
    const db = getDb();
    const oppositeType = type === "expense" ? "income" : "expense";
    const now = new Date();
    const startTime = new Date(now.getTime() - windowMs);

    return db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, oppositeType),
            eq(transactions.amount, amount),
            gte(transactions.date, startTime)
        ))
        .orderBy(desc(transactions.date))
        .get();
}
