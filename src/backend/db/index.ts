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

    const userColumns = sqlite.pragma("table_info(users)") as Array<{ name: string }>;
    if (!userColumns.some((column) => column.name === "updated_at")) {
        sqlite.exec("ALTER TABLE users ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0");
    }

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL REFERENCES users(id),
            expires_at INTEGER NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS auth_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            account_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id),
            access_token TEXT,
            refresh_token TEXT,
            id_token TEXT,
            access_token_expires_at INTEGER,
            refresh_token_expires_at INTEGER,
            scope TEXT,
            password TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS auth_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            identifier TEXT NOT NULL,
            value TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        INSERT INTO auth_accounts (account_id, provider_id, user_id, password, created_at, updated_at)
        SELECT CAST(users.id AS TEXT), 'credential', users.id, users.password, strftime('%s','now') * 1000, strftime('%s','now') * 1000
        FROM users
        WHERE users.password IS NOT NULL
          AND users.password != ''
          AND NOT EXISTS (
              SELECT 1 FROM auth_accounts
              WHERE auth_accounts.user_id = users.id
                AND auth_accounts.provider_id = 'credential'
          );

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
