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
    if (!userSettingsColumns.some((column) => column.name === "view_mode")) {
        sqlite.exec("ALTER TABLE user_settings ADD COLUMN view_mode TEXT NOT NULL DEFAULT 'advanced'");
    }

    const userColumns = sqlite.pragma("table_info(users)") as Array<{ name: string }>;
    if (!userColumns.some((column) => column.name === "is_benefector")) {
        sqlite.exec("ALTER TABLE users ADD COLUMN is_benefector INTEGER NOT NULL DEFAULT 0");
    }

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS mayar_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            transaction_id TEXT NOT NULL UNIQUE,
            user_id INTEGER REFERENCES users(id),
            customer_email TEXT,
            customer_name TEXT,
            product_id TEXT,
            product_name TEXT,
            amount REAL,
            status TEXT NOT NULL DEFAULT 'received',
            tier TEXT,
            is_benefector INTEGER NOT NULL DEFAULT 0,
            raw_payload TEXT NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
        );
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
    if (globalForDb.sqlite) {
        ensureRuntimeSchema(globalForDb.sqlite);
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
