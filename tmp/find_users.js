import Database from 'better-sqlite3';
const db = new Database('./sqlite.db');

try {
    const users = db.prepare('SELECT id, email, name, password FROM users LIMIT 5').all();
    console.log('--- Users ---');
    console.log(JSON.stringify(users, null, 2));
} catch (e) {
    console.error(e);
} finally {
    db.close();
}
