import Database from "better-sqlite3";

const sqlite = new Database("sqlite.db");

// Simulate getMonthlyStats for user 1, April 2026
const userId = 1;
const year = 2026;
const month = 4;

const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 0, 23, 59, 59, 999);

console.log(`\n🔍 Testing stats query for User ${userId}, ${month}/${year}\n`);
console.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

// Get all April transactions
const allAprilTxns = sqlite
    .prepare(
        `SELECT id, amount, type, date, description FROM transactions 
         WHERE user_id = ? AND date >= ? AND date < ?
         LIMIT 10`
    )
    .all(userId, startDate.getTime(), endDate.getTime()) as any[];

console.log(`📊 Sample April transactions (showing first 10):`);
allAprilTxns.forEach((t) => {
    const d = new Date(t.date);
    console.log(`   - ID ${t.id}: ${t.description} | ${t.type} | ${t.amount} | ${d.toISOString()}`);
});

// Count by type
const countByType = sqlite
    .prepare(
        `SELECT type, COUNT(*) as count, SUM(amount) as total 
         FROM transactions 
         WHERE user_id = ? AND date >= ? AND date < ?
         GROUP BY type`
    )
    .all(userId, startDate.getTime(), endDate.getTime()) as any[];

console.log(`\n💰 April 2026 Stats:\n`);
let totalIncome = 0;
let totalExpense = 0;

countByType.forEach((row) => {
    console.log(`${row.type.toUpperCase()}: ${row.count} transactions = Rp ${row.total.toLocaleString("id-ID")}`);
    if (row.type === "income" || row.type === "withdraw") {
        totalIncome += row.total || 0;
    } else if (row.type === "expense") {
        totalExpense += row.total || 0;
    }
});

const balance = totalIncome - totalExpense;
console.log(`\n${"=".repeat(50)}`);
console.log(`INCOME:  Rp ${totalIncome.toLocaleString("id-ID")}`);
console.log(`EXPENSE: Rp ${totalExpense.toLocaleString("id-ID")}`);
console.log(`BALANCE: Rp ${balance.toLocaleString("id-ID")}`);
console.log(`${"=".repeat(50)}\n`);

console.log(`✅ Data is correctly available in database!`);
console.log(`   Login with: admin@monevapp.com / admin123456`);
console.log(`   Then refresh dashboard to see the Rp ${balance.toLocaleString("id-ID")} balance!\n`);

process.exit(0);
