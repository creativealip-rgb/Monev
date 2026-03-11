import { getDb } from "./index";
import { transactions, categories, accounts } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Script untuk generate dummy transactions selama 3 bulan ke belakang
 * Target: admin@monev.com (user ID = 1)
 */

// Helper: Format date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

// Helper: Random number in range
const randomInRange = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;

// Sample data
const expenseDescriptions = [
    "Makan siang",
    "Beli kopi",
    "Transportasi ojek online",
    "Belanja bulanan",
    "Bayar listrik",
    "Beli pulsa",
    "Nonton bioskop",
    "Makan malam",
    "Beli baju",
    "Bayar internet",
    "Beli buku",
    "Gym membership",
    "Beli skincare",
    "Makan bareng teman",
    "Beli snack",
    "Bayar air",
    "Beli obat",
    "Transportasi kereta",
    "Beli sepatu",
    "Makan di restoran",
];

const incomeDescriptions = [
    "Gaji bulanan",
    "Bonus project",
    "Freelance design",
    "Dividen saham",
    "Bonus tahunan",
];

const expenseCategories = [1, 2, 3, 4, 5, 6, 7, 8]; // Category IDs for expenses
const incomeCategories = [9, 10]; // Category IDs for income

const accountId = 1; // Default account

async function generateDummyTransactions() {
    console.log("🚀 Starting dummy transaction generation...");
    
    const db = getDb();
    
    // Get admin user
    const adminUserId = 24; // admin@monevapp.com
    
    // Generate transactions for last 90 days
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const transactionsToInsert: any[] = [];
    let totalExpense = 0;
    let totalIncome = 0;
    
    console.log("📅 Generating transactions from", formatDate(ninetyDaysAgo), "to", formatDate(today));
    
    // Generate 2-4 transactions per day
    for (let day = 0; day < 90; day++) {
        const currentDate = new Date(ninetyDaysAgo);
        currentDate.setDate(currentDate.getDate() + day);
        
        // Skip some days (no transactions on some days)
        if (Math.random() > 0.85) continue; // 15% chance no transactions
        
        // Generate 1-4 expense transactions per day
        const numExpenses = randomInRange(1, 4);
        for (let i = 0; i < numExpenses; i++) {
            const amount = randomInRange(15000, 500000);
            const categoryId = expenseCategories[randomInRange(0, expenseCategories.length - 1)];
            const description = expenseDescriptions[randomInRange(0, expenseDescriptions.length - 1)];
            
            transactionsToInsert.push({
                userId: adminUserId,
                amount,
                description: `${description} - ${currentDate.toLocaleDateString('id-ID', { weekday: 'long' })}`,
                categoryId,
                type: "expense",
                paymentMethod: Math.random() > 0.3 ? "cash" : "bca",
                accountId,
                date: currentDate,
                isVerified: true,
                isRecurring: false,
                createdAt: currentDate,
            });
            
            totalExpense += amount;
        }
        
        // Add income on specific days (1st and 15th of month)
        const dateOfMonth = currentDate.getDate();
        if (dateOfMonth === 1 || dateOfMonth === 15) {
            const incomeAmount = dateOfMonth === 1 ? 8000000 : randomInRange(500000, 2000000);
            const incomeCategoryId = incomeCategories[randomInRange(0, incomeCategories.length - 1)];
            const incomeDesc = dateOfMonth === 1 
                ? "Gaji bulanan" 
                : incomeDescriptions[randomInRange(1, incomeDescriptions.length - 1)];
            
            transactionsToInsert.push({
                userId: adminUserId,
                amount: incomeAmount,
                description: incomeDesc,
                categoryId: incomeCategoryId,
                type: "income",
                paymentMethod: "bca",
                accountId,
                date: currentDate,
                isVerified: true,
                isRecurring: false,
                createdAt: currentDate,
            });
            
            totalIncome += incomeAmount;
        }
    }
    
    // Insert transactions in batches
    console.log(`📦 Inserting ${transactionsToInsert.length} transactions...`);
    
    // Insert one by one (Drizzle doesn't support bulk insert well)
    let inserted = 0;
    for (const txn of transactionsToInsert) {
        await db.insert(transactions).values(txn);
        inserted++;
        if (inserted % 50 === 0) {
            console.log(`  ✓ Inserted ${inserted}/${transactionsToInsert.length} transactions`);
        }
    }
    
    console.log("\n✅ Dummy transaction generation complete!");
    console.log(`📊 Summary:`);
    console.log(`   Total transactions: ${transactionsToInsert.length}`);
    console.log(`   Total expense: Rp ${totalExpense.toLocaleString('id-ID')}`);
    console.log(`   Total income: Rp ${totalIncome.toLocaleString('id-ID')}`);
    console.log(`   Net: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`);
    console.log(`   Date range: ${formatDate(ninetyDaysAgo)} to ${formatDate(today)}`);
}

// Run the script
generateDummyTransactions().catch(console.error);
