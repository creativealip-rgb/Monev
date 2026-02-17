const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
const rows = db.prepare('SELECT id, amount, description FROM transactions ORDER BY id DESC LIMIT 5').all();
console.log('RECENT_TRANSACTIONS:', JSON.stringify(rows, null, 2));
db.close();
