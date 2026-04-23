import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

const { users, transactions } = schema;

const allUsers = db.select().from(users).all();
console.log("\n📋 All Users in Database:\n");
allUsers.forEach((u) => {
    const txnCount = db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, u.id))
        .all().length;
    console.log(
        `ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Tier: ${u.tier} | Transactions: ${txnCount}`
    );
});

console.log("\n✅ Check complete!");
process.exit(0);
