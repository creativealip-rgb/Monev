const Database = require('better-sqlite3');
const db = new Database('./sqlite.db');
try {
    const columns = db.pragma('table_info(user_settings)');
    console.log(JSON.stringify(columns, null, 2));
} catch (e) {
    console.error(e);
}
db.close();
