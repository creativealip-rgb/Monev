import { sql } from 'drizzle-orm';
import { getDb } from '../index';

async function migrate() {
    console.log('Running migration: Create debts table...');
    const db = getDb();

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            debtor_name TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            due_date INTEGER,
            status TEXT DEFAULT 'unpaid' NOT NULL,
            created_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000) NOT NULL
        );
    `);

    console.log('Migration complete!');
}

migrate().catch(console.error);
