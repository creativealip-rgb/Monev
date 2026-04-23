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
        // Hash the new password
        const hashedPassword = await bcryptjs.hash("admin123456", 10);

        // Update admin@monevapp.com
        const result1 = db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, "admin@monevapp.com"))
            .returning()
            .get();

        console.log("✅ Updated admin@monevapp.com");
        console.log(`   New Password Hash: ${hashedPassword.substring(0, 20)}...`);

        // Also update admin@monev.app
        const result2 = db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, "admin@monev.app"))
            .returning()
            .get();

        console.log("\n✅ Updated admin@monev.app");
        console.log(`   New Password Hash: ${hashedPassword.substring(0, 20)}...`);

        console.log("\n" + "=".repeat(60));
        console.log("🎉 Both accounts now use: admin123456\n");
        console.log("Try logging in with:");
        console.log("  📧 Email: admin@monevapp.com");
        console.log("  🔑 Password: admin123456\n");
        console.log("  OR\n");
        console.log("  📧 Email: admin@monev.app");
        console.log("  🔑 Password: admin123456\n");
        console.log("=".repeat(60) + "\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting password:", error);
        process.exit(1);
    }
}

resetAdminPassword();
