
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "sqlite.db");
console.log("Connecting to database at:", dbPath);
const db = new Database(dbPath);

try {
    console.log("Adding columns to user_settings...");

    // Add auto_lock_timeout
    try {
        db.prepare("ALTER TABLE user_settings ADD COLUMN auto_lock_timeout INTEGER NOT NULL DEFAULT 300000").run();
        console.log("Added column auto_lock_timeout");
    } catch (e: any) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column auto_lock_timeout already exists");
        } else {
            throw e;
        }
    }

    // Add quiet_hours_enabled
    try {
        db.prepare("ALTER TABLE user_settings ADD COLUMN quiet_hours_enabled INTEGER NOT NULL DEFAULT 0").run();
        console.log("Added column quiet_hours_enabled");
    } catch (e: any) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column quiet_hours_enabled already exists");
        } else {
            throw e;
        }
    }

    // Add hide_balance if missing (Stealth Mode)
    try {
        db.prepare("ALTER TABLE user_settings ADD COLUMN hide_balance INTEGER NOT NULL DEFAULT 0").run();
        console.log("Added column hide_balance");
    } catch (e: any) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column hide_balance already exists");
        } else {
            throw e;
        }
    }

    console.log("Database sync completed!");
} catch (error) {
    console.error("Database sync failed:", error);
} finally {
    db.close();
}
