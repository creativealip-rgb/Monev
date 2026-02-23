import Database from 'better-sqlite3';
import path from 'path';

// Usage: node scripts/repair-db.js /path/to/sqlite.db
const dbPath = process.argv[2] || './sqlite.db';

console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

try {
    console.log('Adding missing columns...');

    // Add is_active to users
    try {
        db.prepare('ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1').run();
        console.log('✓ Added is_active to users');
    } catch (e) {
        console.log('- is_active already exists or error:', e.message);
    }

    // Add quota to coupons
    try {
        db.prepare('ALTER TABLE coupons ADD COLUMN quota INTEGER NOT NULL DEFAULT 1').run();
        console.log('✓ Added quota to coupons');
    } catch (e) {
        console.log('- quota already exists or error:', e.message);
    }

    // Add claimed_count to coupons
    try {
        db.prepare('ALTER TABLE coupons ADD COLUMN claimed_count INTEGER NOT NULL DEFAULT 0').run();
        console.log('✓ Added claimed_count to coupons');
    } catch (e) {
        console.log('- claimed_count already exists or error:', e.message);
    }

    console.log('\nSuccess! All missing columns have been processed.');
    console.log('You can now restart your application or run npx drizzle-kit push again to sync the rest.');
} catch (error) {
    console.error('Failed to repair database:', error);
} finally {
    db.close();
}
