import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

try {
    const users = db.prepare('SELECT id, name, email, created_at FROM users').all();

    if (users.length === 0) {
        console.log('Tidak ada user terdaftar di database.');
    } else {
        console.log('Daftar User Terdaftar:');
        console.table(users);
    }
} catch (error) {
    console.error('Gagal membaca database:', error);
}
