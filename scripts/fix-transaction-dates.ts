import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

const { transactions } = schema;

// Check for invalid dates
const allTransactions = db.select().from(transactions).all();

const invalidDates = allTransactions.filter((t: any) => {
    const dateObj = typeof t.date === 'string' ? new Date(t.date) : t.date;
    return isNaN(dateObj.getTime());
});

console.log(`\n📊 Transaction Date Check:`);
console.log(`Total transactions: ${allTransactions.length}`);
console.log(`Invalid dates: ${invalidDates.length}`);

if (invalidDates.length > 0) {
    console.log("\n⚠️  Sample invalid transactions:");
    invalidDates.slice(0, 3).forEach((t) => {
        console.log(`- ID: ${t.id}, Date: ${t.date}, Type: ${typeof t.date}`);
    });

    console.log("\n🔧 Fixing invalid dates...");

    // Fix transactions with null or invalid dates
    invalidDates.forEach((t: any) => {
        const newDate = new Date(2026, 3, 22); // Use a valid date
        sqlite
            .prepare(`UPDATE transactions SET date = ? WHERE id = ?`)
            .run(newDate.getTime(), t.id);
    });

    console.log(`✅ Fixed ${invalidDates.length} transactions`);
} else {
    console.log("✅ All transaction dates are valid!");
}

// Verify fix
const user1Txns = db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, 1))
    .all();

console.log(`\n📋 User 1 transactions sample:`);
user1Txns.slice(0, 3).forEach((t: any) => {
    console.log(
        `- ID: ${t.id}, Amount: ${t.amount}, Date: ${new Date(t.date).toISOString()}`
    );
});

process.exit(0);
