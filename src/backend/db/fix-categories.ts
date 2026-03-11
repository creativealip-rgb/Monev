import { getDb } from "./index";
import { transactions, categories } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Script untuk fix kategori transaksi berdasarkan deskripsi
 */

// Mapping keywords ke category ID yang benar
const CATEGORY_KEYWORDS: Record<string, number> = {
    // Makan & Minuman (ID 1)
    "makan": 1,
    "kopi": 1,
    "makan siang": 1,
    "makan malam": 1,
    "sarapan": 1,
    "snack": 1,
    "restoran": 1,
    "kafe": 1,
    "warung": 1,
    
    // Transportasi (ID 2)
    "transport": 2,
    "ojek": 2,
    "gojek": 2,
    "grab": 2,
    "taksi": 2,
    "kereta": 2,
    "bus": 2,
    "bensin": 2,
    "parkir": 2,
    
    // Hiburan (ID 3)
    "hibur": 3,
    "bioskop": 3,
    "nonton": 3,
    "film": 3,
    "game": 3,
    "musik": 3,
    "konser": 3,
    
    // Belanja (ID 4)
    "belanja": 4,
    "beli": 4,
    "baju": 4,
    "sepatu": 4,
    "tas": 4,
    "pakaian": 4,
    "skincare": 4,
    "kosmetik": 4,
    "pulsa": 4,
    "kuota": 4,
    "paket data": 4,
    
    // Kesehatan (ID 5)
    "sehat": 5,
    "obat": 5,
    "dokter": 5,
    "rumah sakit": 5,
    "klinik": 5,
    "vitamin": 5,
    "suplemen": 5,
    "gym": 5,
    "olahraga": 5,
    "fitness": 5,
    
    // Pendidikan (ID 6)
    "didik": 6,
    "sekolah": 6,
    "kuliah": 6,
    "kursus": 6,
    "pelatihan": 6,
    "buku": 6,
    "seminar": 6,
    "workshop": 6,
    
    // Tagihan (ID 7)
    "tagih": 7,
    "listrik": 7,
    "air": 7,
    "internet": 7,
    "wifi": 7,
    "telepon": 7,
    "pulsa tagihan": 7,
    
    // Investasi (ID 8)
    "invest": 8,
    "saham": 8,
    "reksadana": 8,
    "obligasi": 8,
    "deposito": 8,
};

const INCOME_KEYWORDS: Record<string, number> = {
    "gaji": 10,
    "bonus": 11,
    "freelance": 11,
    "project": 11,
    "dividen": 10,
    "bunga": 10,
};

async function fixCategories() {
    console.log("🔧 Starting category fix...");
    
    const db = getDb();
    const adminUserId = 24;
    
    // Get all transactions for admin user (using raw SQL via db.$client)
    const client = (db as any).$client;
    const rawTransactions = client.prepare(`
        SELECT id, description, type, category_id
        FROM transactions
        WHERE user_id = ?
    `).all(adminUserId) as any[];
    
    console.log(`📊 Found ${rawTransactions.length} transactions to process`);
    
    let updated = 0;
    
    for (const txn of rawTransactions) {
        const desc = (txn.description || "").toLowerCase();
        let newCategoryId: number | null = null;
        
        // Find matching keyword
        if (txn.type === "expense") {
            for (const [keyword, categoryId] of Object.entries(CATEGORY_KEYWORDS)) {
                if (desc.includes(keyword)) {
                    newCategoryId = categoryId;
                    break;
                }
            }
        } else if (txn.type === "income") {
            for (const [keyword, categoryId] of Object.entries(INCOME_KEYWORDS)) {
                if (desc.includes(keyword)) {
                    newCategoryId = categoryId;
                    break;
                }
            }
        }
        
        // Update if category found and different
        if (newCategoryId && newCategoryId !== txn.category_id) {
            try {
                await db.update(transactions)
                    .set({ categoryId: newCategoryId })
                    .where(eq(transactions.id, txn.id));
                updated++;
            } catch (err) {
                console.error(`Error updating transaction ${txn.id}:`, err);
            }
        }
    }
    
    console.log("\n✅ Category fix complete!");
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${rawTransactions.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Unchanged: ${rawTransactions.length - updated}`);
}

fixCategories().catch(console.error);
