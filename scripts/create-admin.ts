
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/backend/db/schema";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = process.env.DATABASE_URL || "./sqlite.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function createAdmin() {
    const email = "admin@monevapp.com";
    const password = "password123";

    console.log(`Creating admin account for ${email}...`);

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Check if user already exists
        const existingUser = sqlite.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;

        let userId: number;

        if (existingUser) {
            console.log("User already exists, updating to admin and resetting password...");
            sqlite.prepare("UPDATE users SET password = ?, is_admin = 1 WHERE id = ?").run(hashedPassword, existingUser.id);
            userId = existingUser.id;
        } else {
            console.log("Inserting new admin user...");
            const result = sqlite.prepare(
                "INSERT INTO users (email, password, is_admin, name, tier, is_active, created_at) VALUES (?, ?, 1, 'Admin Monev', 'sultan', 1, ?)"
            ).run(email, hashedPassword, Date.now());
            userId = Number(result.lastInsertRowid);
        }

        // 3. Create/Update user settings
        const existingSettings = sqlite.prepare("SELECT id FROM user_settings WHERE user_id = ?").get(userId);

        if (!existingSettings) {
            console.log("Creating default settings for admin...");
            sqlite.prepare(
                "INSERT INTO user_settings (user_id, has_completed_onboarding, updated_at) VALUES (?, 1, ?)"
            ).run(userId, Date.now());
        } else {
            sqlite.prepare("UPDATE user_settings SET has_completed_onboarding = 1, updated_at = ? WHERE user_id = ?").run(Date.now(), userId);
        }

        console.log("\nSuccess!");
        console.log("-----------------------");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: Admin`);
        console.log("-----------------------");

    } catch (error) {
        console.error("Failed to create admin account:", error);
    } finally {
        sqlite.close();
    }
}

createAdmin();
