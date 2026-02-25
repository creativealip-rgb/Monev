import Database from 'better-sqlite3';
const db = new Database('./sqlite.db');

try {
    const transactionsInfo = db.prepare('PRAGMA table_info(transactions)').all();
    console.log('--- Transactions Table ---');
    console.log(JSON.stringify(transactionsInfo, null, 2));

    const billsInfo = db.prepare('PRAGMA table_info(bills)').all();
    console.log('--- Bills Table ---');
    console.log(JSON.stringify(billsInfo, null, 2));

    const goalsInfo = db.prepare('PRAGMA table_info(goals)').all();
    console.log('--- Goals Table ---');
    console.log(JSON.stringify(goalsInfo, null, 2));

} catch (e) {
    console.error(e);
} finally {
    db.close();
}
