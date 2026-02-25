import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "monev-offline-db";
const STORE_NAME = "transaction-queue";

interface QueuedTransaction {
    id: string;
    data: any;
    timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
    if (typeof window === "undefined") return null;
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id" });
                }
            },
        });
    }
    return dbPromise;
}

export const OfflineManager = {
    // Add transaction to offline queue
    async queueTransaction(data: any): Promise<void> {
        const db = await getDB();
        if (!db) return;

        const item: QueuedTransaction = {
            id: crypto.randomUUID(),
            data,
            timestamp: Date.now(),
        };

        await db.add(STORE_NAME, item);

        // Register for sync if possible
        if ("serviceWorker" in navigator && "SyncManager" in window) {
            try {
                const reg = await navigator.serviceWorker.ready;
                // @ts-ignore
                await reg.sync.register("sync-transactions");
            } catch (err) {
                console.error("Sync registration failed:", err);
            }
        }
    },

    // Get all queued transactions
    async getQueue(): Promise<QueuedTransaction[]> {
        const db = await getDB();
        if (!db) return [];
        return await db.getAll(STORE_NAME);
    },

    // Try to sync all queued items
    async syncQueue(): Promise<{ success: number; failed: number }> {
        const queue = await this.getQueue();
        if (queue.length === 0) return { success: 0, failed: 0 };

        let success = 0;
        let failed = 0;

        const db = await getDB();
        if (!db) return { success: 0, failed: queue.length };

        for (const item of queue) {
            try {
                const res = await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.data),
                });

                if (res.ok) {
                    success++;
                    await db.delete(STORE_NAME, item.id);
                } else {
                    failed++;
                }
            } catch (err) {
                failed++;
            }
        }

        return { success, failed };
    },

    // Check if there are items pending
    async hasPendingItems(): Promise<boolean> {
        const queue = await this.getQueue();
        return queue.length > 0;
    }
};
