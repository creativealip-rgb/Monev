import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;
let isSeeding = false;

export function getDb() {
    if (!db) {
        const dbPath = process.env.DATABASE_URL || "./sqlite.db";
        sqlite = new Database(dbPath);
        db = drizzle(sqlite, { schema });
        // Auto-migrate and seed on first connection (but not during build)
        if (!isSeeding && typeof window === "undefined") {
            isSeeding = true;

            // Run Migrations
            try {
                const migrationsPath = path.join(process.cwd(), "drizzle");
                console.log("Checking for migrations at:", migrationsPath);
                migrate(db, { migrationsFolder: migrationsPath });
                console.log("Database migrations applied successfully.");
            } catch (error) {
                console.error("Migration failed:", error);
            }

            // Seed logic removed - use manual seed script for demo data if needed.
            isSeeding = true; 
        }
    }
    return db;
}

export function closeDb() {
    if (sqlite) {
        sqlite.close();
        sqlite = null;
        db = null;
    }
}

export * from "./schema";
