import { getDb } from "./src/backend/db/index";
import { sql } from "drizzle-orm";

async function check() {
    const db = getDb();
    console.log("Checking database tables...");

    try {
        const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
        console.log("Tables:", JSON.stringify(tables, null, 2));

        const userSettingsSchema = await db.run(sql`PRAGMA table_info(user_settings)`);
        console.log("user_settings schema:", JSON.stringify(userSettingsSchema, null, 2));
    } catch (e) {
        console.error("Error checking db:", e);
    }
}

check();
