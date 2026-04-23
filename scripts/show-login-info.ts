import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

const { users, transactions } = schema;

console.log("\n📋 Available Admin Accounts:\n");
console.log("=".repeat(80));

const allUsers = db.select().from(users).all();

for (const user of allUsers) {
    const txnCount = db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, user.id))
        .all().length;

    console.log(`\n👤 User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Admin: ${user.isAdmin ? "✅ YES" : "❌ NO"}`);
    console.log(`   Tier: ${user.tier}`);
    console.log(`   Transactions: ${txnCount}`);

    if (user.isAdmin) {
        console.log(`   🔐 Password: admin123456`);
    }
}

console.log("\n" + "=".repeat(80));
console.log("\n✅ TEST THE FOLLOWING LOGIN:\n");
console.log("1️⃣  Email: admin@monevapp.com");
console.log("   Password: admin123456");
console.log("   (Old admin account with 1,005 transactions)\n");

console.log("2️⃣  Email: admin@monev.app");
console.log("   Password: admin123456");
console.log("   (Anak Kosan account we just created)\n");

console.log("💡 Try logging in via: http://localhost:3000/login");
console.log("   Then check dashboard at: http://localhost:3000/dashboard\n");

// Verify April 2026 transaction count
const aprilTxns = sqlite
    .prepare(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE date >= ? AND date < ?`
    )
    .get(
        new Date(2026, 3, 1).getTime(),
        new Date(2026, 4, 1).getTime()
    ) as any;

console.log(`📊 April 2026 Transactions: ${aprilTxns.count}\n`);

process.exit(0);
