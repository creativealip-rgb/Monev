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

    // Categories Table
    try {
        db.exec('ALTER TABLE categories ADD COLUMN user_id INTEGER');
        console.log('[✓] Added categories.user_id');
    } catch (e) {
        console.log('[!] categories.user_id might already exist or error:', e.message);
    }

    // Budgets Table
    try {
        db.exec('ALTER TABLE budgets ADD COLUMN user_id INTEGER');
        console.log('[✓] Added budgets.user_id');
    } catch (e) {
        console.log('[!] budgets.user_id might already exist or error:', e.message);
    }

    // Goals Table
    try {
        db.exec('ALTER TABLE goals ADD COLUMN user_id INTEGER');
        console.log('[✓] Added goals.user_id');
    } catch (e) {
        console.log('[!] goals.user_id might already exist or error:', e.message);
    }

    // Merchant Mappings Table
    try {
        db.exec('ALTER TABLE merchant_mappings ADD COLUMN user_id INTEGER');
        console.log('[✓] Added merchant_mappings.user_id');
    } catch (e) {
        console.log('[!] merchant_mappings.user_id might already exist or error:', e.message);
    }

    // User Settings Table
    try {
        db.exec('ALTER TABLE user_settings ADD COLUMN user_id INTEGER');
        console.log('[✓] Added user_settings.user_id');
    } catch (e) {
        console.log('[!] user_settings.user_id might already exist or error:', e.message);
    }

    console.log('Schema update complete.');
} catch (e) {
    console.error('Migration failed:', e);
} finally {
    db.close();
}
