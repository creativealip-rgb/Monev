import { apiFetch } from "@/frontend/lib/api-client";
import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "monev-offline-db";
const STORE_SYNC_QUEUE = "transaction-queue";
const STORE_CACHE = "app-cache";

interface QueuedTransaction {
    id: string;
    data: any;
    timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
    if (typeof window === "undefined") return null;
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 2, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
                    db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORE_CACHE)) {
                    db.createObjectStore(STORE_CACHE);
                }
            },
        });
    }
    return dbPromise;
}

export const OfflineManager = {
    // --- Caching Support ---
    async setCache(key: string, data: any): Promise<void> {
        const db = await getDB();
        if (!db) return;
        await db.put(STORE_CACHE, data, key);
    },

    async getCache(key: string): Promise<any | null> {
        const db = await getDB();
        if (!db) return null;
        return await db.get(STORE_CACHE, key);
    },

    // --- Transaction Sync Queueing ---
    async queueTransaction(data: any): Promise<void> {
        const db = await getDB();
        if (!db) return;

        const item: QueuedTransaction = {
            id: crypto.randomUUID(),
            data,
            timestamp: Date.now(),
        };

        await db.add(STORE_SYNC_QUEUE, item);

        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("offline-queue-changed"));
        }

        // Register for sync if possible (Web only)
        if ("serviceWorker" in navigator && "SyncManager" in window) {
            try {
                const reg = await navigator.serviceWorker.ready;
                // @ts-ignore
                await reg.sync.register("sync-transactions");
            } catch (err) {
                console.warn("Background Sync API (Web) registration failed/unsupported", err);
            }
        }
    },

    async getQueue(): Promise<QueuedTransaction[]> {
        const db = await getDB();
        if (!db) return [];
        return await db.getAll(STORE_SYNC_QUEUE);
    },

    async syncQueue(): Promise<{ success: number; failed: number }> {
        const queue = await this.getQueue();
        if (queue.length === 0) return { success: 0, failed: 0 };

        let success = 0;
        let failed = 0;

        const db = await getDB();
        if (!db) return { success: 0, failed: queue.length };

        for (const item of queue) {
            try {
                const res = await apiFetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.data),
                });

                if (res.ok) {
                    success++;
                    await db.delete(STORE_SYNC_QUEUE, item.id);
                } else {
                    failed++;
                }
            } catch (err) {
                failed++;
            }
        }

        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("offline-queue-changed"));
        }

        return { success, failed };
    },

    async hasPendingItems(): Promise<boolean> {
        const queue = await this.getQueue();
        return queue.length > 0;
    },

    async getOptimisticTransactions(): Promise<any[]> {
        const queue = await this.getQueue();
        return queue.map(item => ({
            ...item.data,
            id: `offline-${item.id}`,
            is_verified: false,
            is_offline: true,
            created_at: new Date(item.timestamp).toISOString(),
            date: new Date(item.timestamp).toISOString(),
        }));
    }
};
