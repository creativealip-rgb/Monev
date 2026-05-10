import { getDb } from "@/backend/db";
import { syncConflicts, syncQueue } from "@/backend/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { createTransaction, deleteTransaction, updateTransaction } from "./transaction-operations";

export type SyncQueueStatus = "pending" | "processing" | "synced" | "failed" | "conflict";

type JsonRecord = Record<string, unknown>;

type SyncQueueItem = typeof syncQueue.$inferSelect;

export type EnqueueSyncInput = {
    clientMutationId: string;
    entityType: string;
    operation: string;
    payload: unknown;
};

function asRecord(value: unknown): JsonRecord {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Payload must be an object");
    }
    return value as JsonRecord;
}

function toPositiveNumber(value: unknown, field: string): number {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue <= 0) {
        throw new Error(`${field} must be a positive number`);
    }
    return numberValue;
}

function toOptionalInteger(value: unknown): number | undefined {
    if (value === null || value === undefined || value === "") return undefined;
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue)) {
        throw new Error("Expected integer value");
    }
    return numberValue;
}

function toTransactionType(value: unknown): "expense" | "income" | "transfer" {
    if (value === "expense" || value === "income" || value === "transfer") return value;
    throw new Error("Unsupported transaction type");
}

async function applyTransactionMutation(userId: number, item: SyncQueueItem) {
    const payload = asRecord(item.payload);

    if (item.operation === "create") {
        return createTransaction(userId, {
            amount: toPositiveNumber(payload.amount, "amount"),
            description: String(payload.description || "Transaksi offline"),
            merchantName: payload.merchantName ? String(payload.merchantName) : undefined,
            categoryId: Number(payload.categoryId || 0),
            type: toTransactionType(payload.type || "expense"),
            paymentMethod: payload.paymentMethod ? String(payload.paymentMethod) : "cash",
            accountId: toOptionalInteger(payload.accountId),
            targetAccountId: toOptionalInteger(payload.targetAccountId),
            date: payload.date ? new Date(String(payload.date)) : new Date(),
        });
    }

    if (item.operation === "update") {
        const id = toOptionalInteger(payload.id);
        if (!id) throw new Error("Transaction id is required for update");

        const updates: JsonRecord = { ...payload };
        delete updates.id;
        if (updates.date) updates.date = new Date(String(updates.date));
        const updated = await updateTransaction(userId, id, updates as Parameters<typeof updateTransaction>[2]);
        if (!updated) throw new Error("Transaction not found");
        return updated;
    }

    if (item.operation === "delete") {
        const id = toOptionalInteger(payload.id);
        if (!id) throw new Error("Transaction id is required for delete");
        await deleteTransaction(userId, id);
        return { id, deleted: true };
    }

    throw new Error(`Unsupported transaction operation: ${item.operation}`);
}

async function applyQueuedMutation(userId: number, item: SyncQueueItem) {
    if (item.entityType === "transaction" || item.entityType === "transactions") {
        return applyTransactionMutation(userId, item);
    }

    throw new Error(`Unsupported sync entity: ${item.entityType}`);
}

export async function enqueueSyncMutation(userId: number, input: EnqueueSyncInput) {
    const db = getDb();
    return db.insert(syncQueue).values({
        userId,
        clientMutationId: input.clientMutationId,
        entityType: input.entityType,
        operation: input.operation,
        payload: input.payload,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
    }).onConflictDoUpdate({
        target: [syncQueue.userId, syncQueue.clientMutationId],
        set: {
            entityType: input.entityType,
            operation: input.operation,
            payload: input.payload,
            status: "pending",
            error: null,
            updatedAt: new Date(),
        },
    }).returning().get();
}

export async function getSyncStatus(userId: number) {
    const db = getDb();
    const queue = db.select().from(syncQueue).where(eq(syncQueue.userId, userId)).all();
    const conflicts = db.select().from(syncConflicts)
        .where(and(eq(syncConflicts.userId, userId), eq(syncConflicts.status, "open")))
        .all();

    const counts = queue.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {});

    return {
        pending: counts.pending || 0,
        processing: counts.processing || 0,
        synced: counts.synced || 0,
        failed: counts.failed || 0,
        conflicts: conflicts.length,
        lastSyncedAt: queue
            .filter(item => item.status === "synced" && item.processedAt)
            .sort((a, b) => Number(b.processedAt) - Number(a.processedAt))[0]?.processedAt || null,
    };
}

export async function processPendingSyncMutations(userId: number, limit = 25) {
    const db = getDb();
    const pending = db.select().from(syncQueue)
        .where(and(eq(syncQueue.userId, userId), inArray(syncQueue.status, ["pending", "failed"])))
        .orderBy(desc(syncQueue.createdAt))
        .limit(limit)
        .all();

    const processed = [];
    for (const item of pending) {
        const now = new Date();
        db.update(syncQueue)
            .set({ status: "processing", attempts: item.attempts + 1, error: null, updatedAt: now })
            .where(and(eq(syncQueue.userId, userId), eq(syncQueue.id, item.id)))
            .run();

        try {
            const result = await applyQueuedMutation(userId, item);
            const updated = db.update(syncQueue)
                .set({
                    status: "synced",
                    payload: { ...asRecord(item.payload), syncResult: result },
                    error: null,
                    updatedAt: new Date(),
                    processedAt: new Date(),
                })
                .where(and(eq(syncQueue.userId, userId), eq(syncQueue.id, item.id)))
                .returning()
                .get();
            processed.push(updated);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown sync error";
            const updated = db.update(syncQueue)
                .set({ status: "failed", error: message, updatedAt: new Date() })
                .where(and(eq(syncQueue.userId, userId), eq(syncQueue.id, item.id)))
                .returning()
                .get();
            processed.push(updated);
        }
    }

    return processed;
}

export async function resolveSyncConflict(userId: number, conflictId: number, resolution: "use_local" | "use_server" | "merge") {
    const db = getDb();
    return db.update(syncConflicts)
        .set({
            status: "resolved",
            resolution,
            resolvedAt: new Date(),
        })
        .where(and(eq(syncConflicts.userId, userId), eq(syncConflicts.id, conflictId)))
        .returning()
        .get();
}
