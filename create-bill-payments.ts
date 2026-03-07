import { getDb } from "./src/backend/db/index";
import { sql } from "drizzle-orm";

async function createTable() {
    const db = getDb();
    console.log("Adding bill_payments table manually...");

    try {
        await db.run(sql`
            CREATE TABLE IF NOT EXISTS bill_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_id INTEGER NOT NULL REFERENCES bills(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                amount REAL NOT NULL,
                paid_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                transaction_id INTEGER REFERENCES transactions(id),
                notes TEXT
            )
        `);

        await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments(bill_id)`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id ON bill_payments(user_id)`);

        console.log("Success: bill_payments table and indices created.");
    } catch (e) {
        console.error("Failed to create table:", e);
    }
}

createTable();
