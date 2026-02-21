import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;

export function getDb() {
    if (!db) {
        const dbPath = process.env.DATABASE_URL || "./sqlite.db";
        sqlite = new Database(dbPath);
        db = drizzle(sqlite, { schema });
        
        // Skip migrations - tables already exist via drizzle-kit push
        // If you need to run migrations, use: npx drizzle-kit push
        console.log("Database connected (migrations skipped - tables already exist)");
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
