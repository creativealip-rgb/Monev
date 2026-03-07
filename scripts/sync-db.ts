
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "sqlite.db");
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

function addColumnIfMissing(table: string, column: string, type: string) {
    try {
        const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
        const exists = info.some(col => col.name === column);

        if (!exists) {
            console.log(`Adding column ${column} to ${table}...`);
            db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
            console.log(`Successfully added ${column} to ${table}.`);
        } else {
            // console.log(`Column ${column} already exists in ${table}.`);
        }
    } catch (e: any) {
        console.error(`Failed to add column ${column} to ${table}:`, e.message);
    }
}

function createTableIfMissing(table: string, schema: string) {
    try {
        const info = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
        if (!info) {
            console.log(`Creating table ${table}...`);
            db.prepare(schema).run();
            console.log(`Successfully created table ${table}.`);
        } else {
            // console.log(`Table ${table} already exists.`);
        }
    } catch (e: any) {
        console.error(`Failed to create table ${table}:`, e.message);
    }
}

try {
    console.log("Starting comprehensive database sync...");

    // Users Table
    addColumnIfMissing("users", "is_admin", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("users", "is_active", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("users", "deletion_requested_at", "INTEGER");
    addColumnIfMissing("users", "whatsapp_id", "TEXT");
    addColumnIfMissing("users", "tier", "TEXT NOT NULL DEFAULT 'miskin'");
    addColumnIfMissing("users", "tier_expires_at", "INTEGER");

    // User Settings Table
    addColumnIfMissing("user_settings", "security_pin", "TEXT");
    addColumnIfMissing("user_settings", "decoy_pin", "TEXT");
    addColumnIfMissing("user_settings", "is_app_lock_enabled", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "is_biometric_enabled", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "hide_balance", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "notifications_enabled", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "has_completed_onboarding", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "financial_persona", "TEXT");
    addColumnIfMissing("user_settings", "persona_updated_at", "INTEGER");
    addColumnIfMissing("user_settings", "daily_report", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "budget_alert", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "transaction_update", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "bill_reminder", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "goal_progress", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "promo_news", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "push_enabled", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "email_enabled", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "telegram_enabled", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "quiet_hours_enabled", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("user_settings", "quiet_hours_start", "TEXT NOT NULL DEFAULT '22:00'");
    addColumnIfMissing("user_settings", "quiet_hours_end", "TEXT NOT NULL DEFAULT '08:00'");
    addColumnIfMissing("user_settings", "auto_lock_timeout", "INTEGER NOT NULL DEFAULT 300000");
    addColumnIfMissing("user_settings", "updated_at", "INTEGER NOT NULL DEFAULT " + Date.now());

    // Budgets Table
    addColumnIfMissing("budgets", "spent", "REAL NOT NULL DEFAULT 0");
    addColumnIfMissing("budgets", "enable_rollover", "INTEGER NOT NULL DEFAULT 0");

    // Sessions Table
    createTableIfMissing("sessions", `
        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            device_info TEXT,
            ip_address TEXT,
            last_active_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )
    `);

    // Admin User Polish
    console.log("Polishing Admin user details...");
    db.prepare("UPDATE users SET first_name = 'Admin', last_name = 'Monev', tier = 'sultan' WHERE email = 'admin@monevapp.com'").run();

    console.log("Database sync completed successfully!");
} catch (error) {
    console.error("Critical error during database sync:", error);
} finally {
    db.close();
}
