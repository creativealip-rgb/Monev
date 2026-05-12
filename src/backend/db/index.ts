import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL || "./sqlite.db";

// Prevent multiple connections during Next.js HMR (dev mode)
const globalForDb = globalThis as unknown as {
    sqlite: Database.Database | undefined;
    db: ReturnType<typeof drizzle<typeof schema>> | undefined;
    schemaChecked: boolean | undefined;
};

function ensureRuntimeSchema(sqlite: Database.Database) {
    if (globalForDb.schemaChecked) return;

    const userSettingsColumns = sqlite.pragma("table_info(user_settings)") as Array<{ name: string }>;
    if (!userSettingsColumns.some((column) => column.name === "monthly_income")) {
        sqlite.exec("ALTER TABLE user_settings ADD COLUMN monthly_income REAL NOT NULL DEFAULT 0");
    }

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS admin_scheduled_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            name TEXT NOT NULL DEFAULT 'Reminder',
            title TEXT NOT NULL DEFAULT 'Monev',
            message TEXT NOT NULL,
            target TEXT NOT NULL DEFAULT 'all',
            tier TEXT,
            hour INTEGER NOT NULL,
            minute INTEGER NOT NULL DEFAULT 0,
            timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
            is_active INTEGER NOT NULL DEFAULT 1,
            last_run_at INTEGER,
            last_run_key TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_admin_scheduled_notifications_active ON admin_scheduled_notifications (is_active);
        CREATE INDEX IF NOT EXISTS idx_admin_scheduled_notifications_run_key ON admin_scheduled_notifications (last_run_key);
    `);

    globalForDb.schemaChecked = true;
}

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
        ensureRuntimeSchema(globalForDb.sqlite);

        globalForDb.db = drizzle(globalForDb.sqlite, { schema });

        // Skip migrations - tables already exist via drizzle-kit push
        console.log("Database connected (migrations skipped - tables already exist)");
    }
    return globalForDb.db;
}

export function getRawDb(): Database.Database {
    getDb(); // Ensure initialization
    return globalForDb.sqlite!;
}

export function closeDb() {
    if (globalForDb.sqlite) {
        globalForDb.sqlite.close();
        globalForDb.sqlite = undefined;
        globalForDb.db = undefined;
    }
}

export * from "./schema";
