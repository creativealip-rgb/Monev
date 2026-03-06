
import { getDb } from "./src/backend/db/index";
import { accounts, transactions, users, categories } from "./src/backend/db/schema";
import { count } from "drizzle-orm";

async function test() {
    console.log("Checking row counts...");
    try {
        const db = getDb();
        const userCount = await db.select({ value: count() }).from(users).get();
        const accCount = await db.select({ value: count() }).from(accounts).get();
        const transCount = await db.select({ value: count() }).from(transactions).get();
        const catCount = await db.select({ value: count() }).from(categories).get();

        console.log(`Users: ${userCount?.value}`);
        console.log(`Accounts: ${accCount?.value}`);
        console.log(`Transactions: ${transCount?.value}`);
        console.log(`Categories: ${catCount?.value}`);

    } catch (error) {
        console.error("Query failed:", error);
    }
    process.exit(0);
}

test();
