const Database = require('better-sqlite3');
const sqlite = new Database('sqlite.db');

const txns = sqlite.prepare(`SELECT COUNT(*) as count, MIN(date) as minDate, MAX(date) as maxDate FROM transactions`).get();
console.log('Total Transactions:', txns.count);
console.log('Min Date:', new Date(txns.minDate).toISOString());
console.log('Max Date:', new Date(txns.maxDate).toISOString());

const april = sqlite.prepare(`
    SELECT 
        COUNT(*) as count, 
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, 
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense 
    FROM transactions 
    WHERE date >= ? AND date < ?
`).get(new Date(2026, 3, 1).getTime(), new Date(2026, 4, 1).getTime());

console.log('\n📅 APRIL 2026:');
console.log('Count:', april.count);
console.log('Income: Rp', (april.income || 0).toLocaleString('id-ID'));
console.log('Expense: Rp', (april.expense || 0).toLocaleString('id-ID'));
console.log('Balance: Rp', ((april.income || 0) - (april.expense || 0)).toLocaleString('id-ID'));
