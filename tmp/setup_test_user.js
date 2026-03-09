import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./sqlite.db');

async function setup() {
    const email = 'admin@monevapp.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = 'Admin Monev';

    try {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            db.prepare('UPDATE users SET password = ?, name = ? WHERE id = ?').run(hashedPassword, name, existing.id);
            console.log('Updated existing test user');
        } else {
            db.prepare('INSERT INTO users (email, password, name, username, first_name, tier, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                email, hashedPassword, name, 'admin', 'Admin', 'sultan', Date.now()
            );
            console.log('Created new test user');
        }
    } catch (e) {
        console.error(e);
    } finally {
        db.close();
    }
}

setup();
