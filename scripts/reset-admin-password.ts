import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite, { schema });

const { users } = schema;

async function resetAdminPassword() {
    console.log("\n🔐 Resetting admin password...\n");

    try {
        const nextPassword = process.env.ADMIN_PASSWORD?.trim();

        if (!nextPassword || nextPassword.length < 8) {
            console.error("❌ Missing ADMIN_PASSWORD env var or password is too short.");
            console.error("   Example: $env:ADMIN_PASSWORD='strong-password'; npx tsx scripts/reset-admin-password.ts");
            process.exit(1);
        }

        // Hash the new password
        const hashedPassword = await bcryptjs.hash(nextPassword, 10);

        // Update admin@monevapp.com
        db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, "admin@monevapp.com"))
            .returning()
            .get();

        console.log("✅ Updated admin@monevapp.com");
        console.log(`   New Password Hash: ${hashedPassword.substring(0, 20)}...`);

        // Also update admin@monev.app
        db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, "admin@monev.app"))
            .returning()
            .get();

        console.log("\n✅ Updated admin@monev.app");
        console.log(`   New Password Hash: ${hashedPassword.substring(0, 20)}...`);

        console.log("\n" + "=".repeat(60));
        console.log("✅ Admin password updated for both admin accounts.");
        console.log("   Password value is read from ADMIN_PASSWORD and is not printed.");
        console.log("   Target accounts:");
        console.log("  • admin@monevapp.com");
        console.log("  • admin@monev.app");
        console.log("=".repeat(60) + "\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting password:", error);
        process.exit(1);
    }
}

resetAdminPassword();
