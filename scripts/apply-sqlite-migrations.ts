import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as BetterSqlite3 from "better-sqlite3";

const Database = (BetterSqlite3 as unknown as { default?: typeof BetterSqlite3 }).default || BetterSqlite3;

const dbPath = process.env.DATABASE_URL || "./sqlite.db";
const migrationsDir = join(process.cwd(), "drizzle");

if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS __monev_sql_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);
`);

const migrations = readdirSync(migrationsDir)
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort((a, b) => a.localeCompare(b));

const appliedCount = db.prepare("SELECT COUNT(*) AS count FROM __monev_sql_migrations").get() as { count: number };
const hasExistingSchema = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'accounts'").get();

if (appliedCount.count === 0 && hasExistingSchema) {
    const baseline = db.transaction(() => {
        for (const filename of migrations) {
            const sql = readFileSync(join(migrationsDir, filename), "utf8").trim();
            if (!sql) continue;
            const hash = createHash("sha256").update(sql).digest("hex");
            db.prepare("INSERT INTO __monev_sql_migrations (filename, hash) VALUES (?, ?)").run(filename, hash);
        }
    });
    baseline();
    console.log("baseline existing SQLite schema");
}

for (const filename of migrations) {
    const sql = readFileSync(join(migrationsDir, filename), "utf8").trim();
    if (!sql) continue;

    const hash = createHash("sha256").update(sql).digest("hex");
    const existing = db.prepare("SELECT hash FROM __monev_sql_migrations WHERE filename = ?").get(filename) as { hash: string } | undefined;

    if (existing) {
        if (existing.hash !== hash) {
            throw new Error(`Migration hash mismatch for ${filename}. Create a new migration instead of editing applied SQL.`);
        }
        console.log(`skip ${filename}`);
        continue;
    }

    const apply = db.transaction(() => {
        db.exec(sql);
        db.prepare("INSERT INTO __monev_sql_migrations (filename, hash) VALUES (?, ?)").run(filename, hash);
    });

    apply();
    console.log(`applied ${filename}`);
}

db.close();
