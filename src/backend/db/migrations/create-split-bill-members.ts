import { sql } from "drizzle-orm";
import { getDb } from "../index";

async function migrate() {
    console.log("Running migration: Create split_bill_members table...");
    const db = getDb();

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS split_bill_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            split_group_id TEXT NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name TEXT NOT NULL,
            email TEXT,
            whatsapp_number TEXT,
            share_amount REAL NOT NULL,
            paid_amount REAL DEFAULT 0 NOT NULL,
            status TEXT DEFAULT 'pending' NOT NULL,
            invited_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000) NOT NULL,
            paid_at INTEGER,
            created_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000) NOT NULL
        );
    `);

    await db.run(sql`
        CREATE INDEX IF NOT EXISTS idx_split_bill_members_group ON split_bill_members(split_group_id);
    `);

    await db.run(sql`
        CREATE INDEX IF NOT EXISTS idx_split_bill_members_user ON split_bill_members(user_id);
    `);

    await db.run(sql`
        CREATE INDEX IF NOT EXISTS idx_split_bill_members_status ON split_bill_members(status);
    `);

    console.log("Migration complete! Created split_bill_members table with indexes.");
}

migrate().catch(console.error);
