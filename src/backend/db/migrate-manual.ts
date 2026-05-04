import { getDb } from "./index";

async function migrate() {
    const db = getDb();
    try {
        console.log("Adding is_read column to notification_logs...");
        // @ts-ignore
        await (db.run as any)("ALTER TABLE notification_logs ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0");
        console.log("Success!");
    } catch (error: any) {
        if (error.message.includes("duplicate column name")) {
            console.log("Column already exists, skipping.");
        } else {
            console.error("Error migrating:", error);
        }
    }
}

migrate();
