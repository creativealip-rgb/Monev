import { sql } from 'drizzle-orm';
import { getDb } from '../index';

async function migrate() {
    console.log('Running migration: Create users table...');
    const db = getDb();

    await db.run(sql`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000) NOT NULL
        );
    `);

    console.log('Migration complete!');
}

migrate().catch(console.error);
