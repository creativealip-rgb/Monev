import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;

export function getDb() {
    if (!db) {
        sqlite = new Database("./sqlite.db");
        db = drizzle(sqlite, { schema });
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
