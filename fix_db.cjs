const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');

try {
    console.log("Adding is_biometric_enabled...");
    db.prepare("ALTER TABLE user_settings ADD COLUMN is_biometric_enabled INTEGER NOT NULL DEFAULT 0").run();
} catch (e) {
    console.log("is_biometric_enabled already exists or error:", e.message);
}

try {
    console.log("Adding financial_persona...");
    db.prepare("ALTER TABLE user_settings ADD COLUMN financial_persona TEXT").run();
} catch (e) {
    console.log("financial_persona already exists or error:", e.message);
}

try {
    console.log("Adding persona_updated_at...");
    db.prepare("ALTER TABLE user_settings ADD COLUMN persona_updated_at INTEGER").run();
} catch (e) {
    console.log("persona_updated_at already exists or error:", e.message);
}

db.close();
console.log("Done.");
