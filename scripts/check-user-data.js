import { getDb } from "../src/backend/db/index.js";

async function checkUserData() {
    const db = getDb();
    
    // Check user
    const user = db.prepare(`
        SELECT id, email, name FROM users WHERE email = 'admin@monevapp.com'
    `).get();
    
    if (!user) {
        console.log('❌ User admin@monevapp.com NOT FOUND');
        return;
    }
    
    console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        name: user.name
    });
    
    // Check transactions
    const txnCount = db.prepare(`
        SELECT COUNT(*) as c FROM transactions WHERE user_id = ?
    `).get(user.id);
    console.log('📊 Transactions:', txnCount.c);
    
    // Check accounts
    const accounts = db.prepare(`
        SELECT COUNT(*) as c FROM accounts WHERE user_id = ?
    `).get(user.id);
    console.log('💳 Accounts:', accounts.c);
    
    // Check budgets
    const budgets = db.prepare(`
        SELECT COUNT(*) as c FROM budgets WHERE user_id = ?
    `).get(user.id);
    console.log('📋 Budgets:', budgets.c);
    
    // Sample transactions
    const samples = db.prepare(`
        SELECT id, description, amount, type, date 
        FROM transactions 
        WHERE user_id = ? 
        ORDER BY date DESC 
        LIMIT 5
    `).all(user.id);
    
    console.log('\n📝 Latest 5 transactions:');
    samples.forEach(s => {
        console.log(`   - ${s.description} (${s.type}): Rp ${s.amount.toLocaleString('id-ID')}`);
    });
}

checkUserData().catch(console.error);
