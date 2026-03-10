import { sql } from "drizzle-orm";
import { getDb } from "../index";

export async function addSplitBillColumns() {
    const db = getDb();
    
    try {
        // Add split_group_id column
        try {
            await db.run(sql`ALTER TABLE debts ADD COLUMN split_group_id TEXT`);
            console.log('[✓] Added debts.split_group_id');
        } catch (e: any) {
            if (!e.message.includes('duplicate column')) {
                throw e;
            }
            console.log('[!] debts.split_group_id already exists');
        }
        
        // Add transaction_id column
        try {
            await db.run(sql`ALTER TABLE debts ADD COLUMN transaction_id INTEGER REFERENCES transactions(id)`);
            console.log('[✓] Added debts.transaction_id');
        } catch (e: any) {
            if (!e.message.includes('duplicate column')) {
                throw e;
            }
            console.log('[!] debts.transaction_id already exists');
        }
        
        // Add is_split_bill column
        try {
            await db.run(sql`ALTER TABLE debts ADD COLUMN is_split_bill INTEGER DEFAULT 0`);
            console.log('[✓] Added debts.is_split_bill');
        } catch (e: any) {
            if (!e.message.includes('duplicate column')) {
                throw e;
            }
            console.log('[!] debts.is_split_bill already exists');
        }
        
        // Create indexes for better performance
        try {
            await db.run(sql`CREATE INDEX IF NOT EXISTS idx_debts_split_group ON debts(split_group_id)`);
            console.log('[✓] Created index idx_debts_split_group');
        } catch (e: any) {
            console.log('[!] Could not create idx_debts_split_group:', e.message);
        }
        
        try {
            await db.run(sql`CREATE INDEX IF NOT EXISTS idx_debts_transaction_id ON debts(transaction_id)`);
            console.log('[✓] Created index idx_debts_transaction_id');
        } catch (e: any) {
            console.log('[!] Could not create idx_debts_transaction_id:', e.message);
        }
        
        console.log('[✓] Split bill migration completed successfully');
    } catch (error) {
        console.error('[✗] Migration failed:', error);
        throw error;
    }
}

// Run migration
if (process.env.RUN_MIGRATION === 'true') {
    addSplitBillColumns()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
