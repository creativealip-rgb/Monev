import { getDb } from "@/backend/db";
import { syncConflicts, syncQueue } from "@/backend/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export type SyncQueueStatus = "pending" | "processing" | "synced" | "failed" | "conflict";

export type EnqueueSyncInput = {
    clientMutationId: string;
    entityType: string;
    operation: string;
    payload: unknown;
};

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

    const now = new Date();
    const processed = [];
    for (const item of pending) {
        const updated = db.update(syncQueue)
            .set({
                status: "synced",
                attempts: item.attempts + 1,
                error: null,
                updatedAt: now,
                processedAt: now,
            })
            .where(and(eq(syncQueue.userId, userId), eq(syncQueue.id, item.id)))
            .returning()
            .get();
        processed.push(updated);
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
