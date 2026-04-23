import Database from 'better-sqlite3';

const sqlite = new Database('sqlite.db');

const txns = sqlite.prepare(`SELECT COUNT(*) as count, MIN(date) as minDate, MAX(date) as maxDate FROM transactions`).get() as any;
console.log('\n📊 Database Summary:');
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
`).get(new Date(2026, 3, 1).getTime(), new Date(2026, 4, 1).getTime()) as any;

console.log('\n📅 APRIL 2026 STATS:');
console.log('├─ Transactions: ', april.count);
console.log('├─ Income: Rp', (april.income || 0).toLocaleString('id-ID'));
console.log('├─ Expense: Rp', (april.expense || 0).toLocaleString('id-ID'));
console.log('└─ Balance: Rp', ((april.income || 0) - (april.expense || 0)).toLocaleString('id-ID'));

// Check all months
console.log('\n📈 Transactions by Month:');
const byMonth = sqlite.prepare(`
    SELECT 
        strftime('%Y-%m', datetime(date/1000, 'unixepoch')) as month,
        COUNT(*) as count,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    GROUP BY month
    ORDER BY month
`).all() as any[];

byMonth.forEach((row) => {
    const balance = (row.income || 0) - (row.expense || 0);
    console.log(`${row.month}: ${row.count} txns | Income: Rp ${(row.income || 0).toLocaleString('id-ID')} | Expense: Rp ${(row.expense || 0).toLocaleString('id-ID')} | Balance: Rp ${balance.toLocaleString('id-ID')}`);
});

console.log('\n✅ LOGIN WITH: admin@monevapp.com / admin123456\n');
process.exit(0);
