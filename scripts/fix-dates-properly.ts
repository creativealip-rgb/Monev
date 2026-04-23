import Database from "better-sqlite3";

const sqlite = new Database("sqlite.db");

console.log(`\n🔧 Fixing all transaction dates to 2026...\n`);

// Get all transactions
const allTxns = sqlite.prepare("SELECT id, date FROM transactions ORDER BY id").all() as any[];

console.log(`Total transactions to fix: ${allTxns.length}`);

// Create a range of dates across Jan-April 2026
const startDate = new Date(2026, 0, 1).getTime(); // Jan 1, 2026
const endDate = new Date(2026, 3, 22).getTime(); // Apr 22, 2026

let fixedCount = 0;

allTxns.forEach((t, idx) => {
    // Distribute transactions evenly across the date range
    const ratio = idx / allTxns.length;
    const newDate = startDate + ratio * (endDate - startDate);

    sqlite
        .prepare("UPDATE transactions SET date = ? WHERE id = ?")
        .run(newDate, t.id);

    fixedCount++;
});

console.log(`✅ Fixed ${fixedCount} transactions\n`);

// Verify
const sample = sqlite.prepare("SELECT id, date FROM transactions LIMIT 3").all() as any[];
console.log("Sample of fixed dates:");
sample.forEach((t: any) => {
    const d = new Date(t.date);
    console.log(
        `- ID: ${t.id}, Timestamp: ${t.date}, Date: ${d.toISOString()}`
    );
});

// Count by month
const byMonth = sqlite
    .prepare(`
        SELECT 
            strftime('%Y-%m', datetime(date/1000, 'unixepoch')) as month,
            COUNT(*) as count
        FROM transactions
        GROUP BY month
        ORDER BY month
    `)
    .all() as any[];

console.log("\n📊 Transactions by month:");
byMonth.forEach((row: any) => {
    console.log(`- ${row.month}: ${row.count} transactions`);
});

console.log("\n✅ Date fix complete!");
process.exit(0);
