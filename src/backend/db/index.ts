import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;
let isSeeding = false;

export function getDb() {
    if (!db) {
        const dbPath = process.env.DATABASE_URL || "./sqlite.db";
        sqlite = new Database(dbPath);
        db = drizzle(sqlite, { schema });
        // Auto-seed on first connection (but not during build)
        if (!isSeeding && typeof window === "undefined") {
            isSeeding = true;
            import("./seed").then(({ seedDatabase }) => {
                seedDatabase().catch(console.error);
            });
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
