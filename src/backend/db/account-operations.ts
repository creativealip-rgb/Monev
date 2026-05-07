import { getDb } from "./index";
import { accounts, transactions } from "./schema";
import type { Account, InsertAccount } from "./schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Get all accounts for a user.
 */
export async function getAccounts(userId: number): Promise<Account[]> {
    const db = getDb();
    return db.select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .orderBy(desc(accounts.balance))
        .all();
}

/**
 * Get a single account by ID.
 */
export async function getAccountById(userId: number, id: number): Promise<Account | undefined> {
    const db = getDb();
    return db.select()
        .from(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .get();
}

/**
 * Create a new account.
 */
export async function createAccount(userId: number, data: Omit<InsertAccount, "userId">): Promise<Account> {
    const db = getDb();
    return db.insert(accounts)
        .values({ ...data, userId })
        .returning()
        .get();
}

export async function createBalanceAuditEntry(userId: number, data: {
    accountId: number;
    accountName: string;
    amount: number;
    kind: "opening_balance" | "balance_adjustment";
    previousBalance?: number;
    nextBalance?: number;
}) {
    if (!Number.isFinite(data.amount) || data.amount === 0) return;

    const db = getDb();
    const prefix = data.kind === "opening_balance" ? "[OPENING_BALANCE]" : "[BALANCE_ADJUSTMENT]";
    const description = data.kind === "opening_balance"
        ? `${prefix} Saldo awal ${data.accountName}`
        : `${prefix} Penyesuaian saldo ${data.accountName}: Rp ${Number(data.previousBalance || 0).toLocaleString("id-ID")} -> Rp ${Number(data.nextBalance || 0).toLocaleString("id-ID")}`;

    return db.insert(transactions)
        .values({
            userId,
            accountId: data.accountId,
            amount: Math.abs(data.amount),
            description,
            merchantName: "Penyesuaian Saldo",
            type: data.amount >= 0 ? "income" : "expense",
            paymentMethod: "adjustment",
            date: new Date(),
            isVerified: true,
        })
        .returning()
        .get();
}

/**
 * Update an existing account.
 */
export async function updateAccount(userId: number, id: number, data: Partial<Account>): Promise<Account | undefined> {
    const db = getDb();
    return db.update(accounts)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .returning()
        .get();
}

/**
 * Delete an account.
 * Removes all transactions where this account is source OR target,
 * then deletes the account itself.
 */
export async function deleteAccount(userId: number, id: number): Promise<void> {
    const db = getDb();
    db.transaction((tx) => {
        // Delete transactions where this account is the source
        tx.delete(transactions)
            .where(and(eq(transactions.accountId, id), eq(transactions.userId, userId)))
            .run();

        // Delete transactions where this account is the transfer target
        tx.delete(transactions)
            .where(and(eq(transactions.targetAccountId, id), eq(transactions.userId, userId)))
            .run();

        // Nullify any remaining targetAccountId references (edge case: other user's transfers)
        tx.update(transactions)
            .set({ targetAccountId: null })
            .where(eq(transactions.targetAccountId, id))
            .run();

        tx.delete(accounts)
            .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
            .run();
    });
}

/**
 * Update account balance atomically.
 */
export async function updateAccountBalance(userId: number, accountId: number, amount: number): Promise<void> {
    const db = getDb();
    await db.update(accounts)
        .set({
            balance: sql`${accounts.balance} + ${amount}`,
            updatedAt: new Date()
        })
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
}
