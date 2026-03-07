import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL || "./sqlite.db";

// Prevent multiple connections during Next.js HMR (dev mode)
const globalForDb = globalThis as unknown as {
    sqlite: Database.Database | undefined;
    db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function getDb() {
    // Force a one-time reset if needed after schema changes
    if ((globalThis as any).__shouldResetDb) {
        console.log("[DB] Resetting global database connection...");
        if (globalForDb.sqlite) globalForDb.sqlite.close();
        globalForDb.db = undefined;
        globalForDb.sqlite = undefined;
        (globalThis as any).__shouldResetDb = false;
    }

    if (!globalForDb.db) {
        globalForDb.sqlite = new Database(dbPath);
        // Enable WAL mode for better concurrency and less locking
        globalForDb.sqlite.pragma('journal_mode = WAL');

        globalForDb.db = drizzle(globalForDb.sqlite, { schema });

        // Skip migrations - tables already exist via drizzle-kit push
        console.log("Database connected (migrations skipped - tables already exist)");
    }
    return globalForDb.db;
}

export function closeDb() {
    if (globalForDb.sqlite) {
        globalForDb.sqlite.close();
        globalForDb.sqlite = undefined;
        globalForDb.db = undefined;
    }
}

export * from "./schema";
