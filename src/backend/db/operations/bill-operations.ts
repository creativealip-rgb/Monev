import { getDb, getRawDb } from "../index";
import { bills, billPayments, accounts, transactions, categories } from "../schema";
import type { Bill } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { updateUserStreak } from "./gamification-operations";

// ============ Bills CRUD ============

export async function getBills(userId: number): Promise<Bill[]> {
    const db = getDb();
    return db.select().from(bills).where(eq(bills.userId, userId)).orderBy(bills.dueDate).all();
}

export async function getBillById(userId: number, id: number): Promise<Bill | undefined> {
    const db = getDb();
    return db.select().from(bills).where(and(eq(bills.id, id), eq(bills.userId, userId))).get();
}

export async function createBill(userId: number, data: {
    name: string;
    amount: number;
    categoryId?: number;
    dueDate?: number;
    frequency?: "monthly" | "weekly" | "yearly";
    icon?: string;
    color?: string;
    notes?: string;
}): Promise<Bill> {
    const db = getDb();
    const result = await db.insert(bills).values({
        userId,
        name: data.name,
        amount: data.amount,
        categoryId: data.categoryId || null,
        dueDate: data.dueDate || 1,
        frequency: data.frequency || "monthly",
        icon: data.icon || "Receipt",
        color: data.color || "#6366f1",
        notes: data.notes || null,
    }).returning();
    return result[0];
}

export async function updateBill(userId: number, id: number, data: Partial<Bill>): Promise<Bill | undefined> {
    const db = getDb();
    const result = await db.update(bills)
        .set(data)
        .where(and(eq(bills.id, id), eq(bills.userId, userId)))
        .returning();
    return result[0];
}

export async function deleteBill(userId: number, id: number): Promise<void> {
    const db = getDb();
    
    // First delete associated bill payments
    await db.delete(billPayments)
        .where(and(eq(billPayments.billId, id), eq(billPayments.userId, userId)));
    
    // Then delete the bill
    await db.delete(bills).where(and(eq(bills.id, id), eq(bills.userId, userId)));
}

export async function toggleBillPaid(userId: number, id: number): Promise<Bill | undefined> {
    const db = getDb();
    const bill = await getBillById(userId, id);
    if (!bill) return undefined;

    const newPaid = !bill.isPaid;
    const result = await db.update(bills)
        .set({
            isPaid: newPaid,
            lastPaidAt: newPaid ? new Date() : bill.lastPaidAt, // Don't nullify history on toggle off
        })
        .where(and(eq(bills.id, id), eq(bills.userId, userId)))
        .returning();

    if (newPaid) {
        // Record to history
        await db.insert(billPayments).values({
            billId: id,
            userId,
            amount: bill.amount,
            paidAt: new Date(),
            notes: "Ditandai lunas (Toggle)"
        });
    }

    return result[0];
}

export async function getBillHistory(userId: number, billId: number) {
    const db = getDb();
    return db.select()
        .from(billPayments)
        .where(and(eq(billPayments.billId, billId), eq(billPayments.userId, userId)))
        .orderBy(desc(billPayments.paidAt))
        .all();
}

export async function payBill(
    userId: number,
    billId: number,
    data: {
        accountId: number;
        amount: number;
        notes?: string;
    }
): Promise<{ billPayment: typeof billPayments.$inferSelect; transaction: typeof transactions.$inferSelect } | undefined> {
    const db = getDb();
    const rawDb = getRawDb();

    // 1. Get bill details
    const bill = db.select()
        .from(bills)
        .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
        .get();

    if (!bill) return undefined;

    // 2. Get account and check balance
    const account = db.select()
        .from(accounts)
        .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, userId)))
        .get();

    if (!account) throw new Error("Account not found");
    if (account.balance < data.amount) throw new Error("Insufficient balance");

    let result: { billPayment: typeof billPayments.$inferSelect; transaction: typeof transactions.$inferSelect } | undefined;
    const now = new Date();

    // Get default "Tagihan" category if bill has no category
    let categoryId = bill.categoryId;
    console.log("[payBill] Original bill.categoryId:", categoryId);
    
    if (!categoryId) {
        const tagihanCategory = db.select()
            .from(categories)
            .where(and(eq(categories.name, "Tagihan"), eq(categories.userId, userId)))
            .get();
        console.log("[payBill] Found Tagihan category:", tagihanCategory);
        if (tagihanCategory) {
            categoryId = tagihanCategory.id;
        }
    }
    console.log("[payBill] Final categoryId to use:", categoryId);

    try {
        result = db.transaction((tx) => {
            // 3. Create expense transaction
            console.log("[payBill] Creating transaction with categoryId:", categoryId);
            const transactionResult = tx.insert(transactions)
                .values({
                    userId,
                    amount: data.amount,
                    description: `Pembayaran ${bill.name}`,
                    merchantName: bill.name,
                    categoryId: categoryId,
                    type: "expense",
                    paymentMethod: "transfer",
                    accountId: data.accountId,
                    destinationType: "bill",
                    destinationId: billId,
                    date: now,
                    isVerified: true,
                    isRecurring: false,
                })
                .returning()
                .get();
            console.log("[payBill] Created transaction with categoryId:", transactionResult.categoryId);

            // 4. Update account balance
            const updateBalance = rawDb.prepare(`
                UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?
            `);
            updateBalance.run(data.amount, now.getTime(), data.accountId);

            // 5. Create bill payment record
            const billPaymentResult = tx.insert(billPayments)
                .values({
                    billId,
                    userId,
                    amount: data.amount,
                    paidAt: now,
                    transactionId: transactionResult.id,
                    notes: data.notes || `Pembayaran ${bill.name}`,
                })
                .returning()
                .get();

            // 6. Update bill status
            const totalPaid = tx.select({ total: sql<number>`SUM(${billPayments.amount})` })
                .from(billPayments)
                .where(and(eq(billPayments.billId, billId), eq(billPayments.userId, userId)))
                .get();

            const isFullyPaid = totalPaid && totalPaid.total >= bill.amount;

            const updateBill = rawDb.prepare(`
                UPDATE bills SET is_paid = ?, last_paid_at = ? WHERE id = ?
            `);
            updateBill.run(isFullyPaid ? 1 : 0, now.getTime(), billId);

            return {
                billPayment: billPaymentResult,
                transaction: transactionResult,
            };
        });
    } catch (error) {
        console.error("[payBill] Transaction failed:", error);
        throw error;
    }

    // Update gamification streak outside transaction
    if (result) {
        updateUserStreak(userId).catch(console.error);
    }

    return result;
}

export async function ensureSampleBills(userId: number): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(bills).where(eq(bills.userId, userId)).all();
    if (existing.length > 0) return;

    const allCats = await db.select().from(categories).all();
    const getCatId = (name: string) => allCats.find(c => c.name === name)?.id || null;

    await db.insert(bills).values([
        { userId, name: "Listrik PLN", amount: 350000, categoryId: getCatId("Tagihan"), dueDate: 20, icon: "Zap", color: "#f59e0b" },
        { userId, name: "WiFi Indihome", amount: 399000, categoryId: getCatId("Tagihan"), dueDate: 15, icon: "Wifi", color: "#3b82f6" },
        { userId, name: "Netflix", amount: 54000, categoryId: getCatId("Hiburan"), dueDate: 5, icon: "Tv", color: "#ef4444" },
    ]);
}
