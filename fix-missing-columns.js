import Database from 'better-sqlite3';
const db = new Database('./sqlite.db');

try {
    console.log('Adding missing columns...');

    // Transactions Table
    // split_group_id
    try {
        db.exec('ALTER TABLE transactions ADD COLUMN split_group_id TEXT');
        console.log('[✓] Added transactions.split_group_id');
    } catch (e) {
        console.log('[!] transactions.split_group_id might already exist or error:', e.message);
    }

    // Bills Table
    // is_subscription
    try {
        db.exec('ALTER TABLE bills ADD COLUMN is_subscription INTEGER NOT NULL DEFAULT 0');
        console.log('[✓] Added bills.is_subscription');
    } catch (e) {
        console.log('[!] bills.is_subscription might already exist or error:', e.message);
    }

    // last_detected_date
    try {
        db.exec('ALTER TABLE bills ADD COLUMN last_detected_date INTEGER');
        console.log('[✓] Added bills.last_detected_date');
    } catch (e) {
        console.log('[!] bills.last_detected_date might already exist or error:', e.message);
    }

    console.log('Schema update complete.');
} catch (e) {
    console.error('Migration failed:', e);
} finally {
    db.close();
}
