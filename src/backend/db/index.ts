import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;

export function getDb() {
    if (!drizzleDb) {
        sqlite = new Database("./sqlite.db");
        drizzleDb = drizzle(sqlite, { schema });
    }
    return drizzleDb;
}

export function closeDb() {
    if (sqlite) {
        sqlite.close();
        sqlite = null;
        drizzleDb = null;
    }
}

// Direct database instance for simple queries
export const db = getDb();

export * from "./schema";
