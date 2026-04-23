import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

const { users } = schema;

async function updateTierToSultan() {
    console.log("🔄 Updating admin tier to SULTAN...\n");

    try {
        const result = db
            .update(users)
            .set({ tier: "sultan" })
            .where(eq(users.email, "admin@monev.app"))
            .returning()
            .get();

        console.log("✅ Admin tier updated successfully!\n");
        console.log("Updated User:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`ID: ${result.id}`);
        console.log(`Email: ${result.email}`);
        console.log(`Name: ${result.name}`);
        console.log(`Tier: ${result.tier} 👑`);
        console.log(`Admin: ${result.isAdmin}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log("🎉 Budi Santoso is now a SULTAN member!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error updating tier:", error);
        process.exit(1);
    }
}

updateTierToSultan();
