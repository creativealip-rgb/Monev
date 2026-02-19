import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "../src/backend/db/schema";
import "dotenv/config";

const dbPath = process.env.DATABASE_URL || "./sqlite.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function runMigrations() {
    console.log("Running Drizzle migrations...");
    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("Migrations finished!");
    } catch (error) {
        console.error("Error during migrations:", error);
        process.exit(1);
    } finally {
        sqlite.close();
    }
}

runMigrations();
