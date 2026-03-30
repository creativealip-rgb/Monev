import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'sqlite.db');
const ADMIN_EMAIL = 'admin@monevapp.com';
const NEW_PASSWORD = 'password123';

// Hash password
const passwordHash = bcrypt.hashSync(NEW_PASSWORD, 10);
console.log('New hash:', passwordHash);

// Connect to database
const db = new sqlite3.Database(DB_PATH);

// Check if user exists
db.get('SELECT id, email FROM users WHERE email = ?', [ADMIN_EMAIL], (err, user) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }
    
    if (user) {
        console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
        
        // Update password
        db.run('UPDATE users SET password = ? WHERE email = ?', [passwordHash, ADMIN_EMAIL], (err) => {
            if (err) {
                console.error('Error updating password:', err);
            } else {
                console.log('✅ Password updated successfully!');
                console.log(`   Email: ${ADMIN_EMAIL}`);
                console.log(`   Password: ${NEW_PASSWORD}`);
            }
            db.close();
        });
    } else {
        console.log(`❌ User not found: ${ADMIN_EMAIL}`);
        db.close();
    }
});
