
import { getDb } from "../src/backend/db/index";
import { users, transactions, budgets, categories } from "../src/backend/db/schema";
import {
    createTransaction,
    getTransactions,
    upsertUser,
    createBudget,
    getBudgets,
    getCategories
} from "../src/backend/db/operations";
import { eq } from "drizzle-orm";

async function verifyIsolation() {
    console.log("🔍 Starting Data Isolation verification...");

    // 1. Setup Test Users
    const userA = await upsertUser({
        telegramId: 1001,
        username: "user_a",
        firstName: "Test",
        lastName: "User A"
    });

    const userB = await upsertUser({
        telegramId: 1002,
        username: "user_b",
        firstName: "Test",
        lastName: "User B"
    });

    console.log(`✅ Users created: A(${userA.id}), B(${userB.id})`);

    // 2. Clear previous test data (Transactions only)
    const db = getDb();
    await db.delete(transactions).where(eq(transactions.userId, userA.id));
    await db.delete(transactions).where(eq(transactions.userId, userB.id));
    await db.delete(budgets).where(eq(budgets.userId, userA.id));
    await db.delete(budgets).where(eq(budgets.userId, userB.id));

    console.log("Deleted previous test data.");

    // 3. Setup Category
    let allCats = await getCategories();
    let catId = allCats[0]?.id;

    if (!catId) {
        console.log("⚠️ No categories found. Inserting test category...");
        const db = getDb();
        const res = await db.insert(categories).values({
            name: "Test Category",
            type: "expense",
            icon: "Test",
            color: "#000000"
        }).returning().get();
        catId = res.id;
    }

    // 4. User A actions
    console.log(`📝 User A adding transaction (Category ID: ${catId})...`);
    await createTransaction(userA.id, {
        amount: 100000,
        description: "User A Secret Transaction",
        categoryId: catId,
        type: "expense",
        date: new Date()
    });

    await createBudget(userA.id, {
        categoryId: catId,
        amount: 5000000,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    // 4. Verification from User A perspective
    const txA = await getTransactions(userA.id);
    const budgetsA = await getBudgets(userA.id, new Date().getMonth() + 1, new Date().getFullYear());

    if (txA.length !== 1 || txA[0].description !== "User A Secret Transaction") {
        console.error("❌ User A failed to see their own transaction!");
    } else {
        console.log("✅ User A sees their transaction.");
    }

    if (budgetsA.length < 1) { // createBudget might return sample budgets too, so check count
        console.error("❌ User A failed to see their budget!");
    } else {
        console.log(`✅ User A sees ${budgetsA.length} budgets.`);
    }

    // 5. Verification from User B perspective
    console.log("🕵️ User B checking for A's data...");
    const txB = await getTransactions(userB.id);
    const budgetsB = await getBudgets(userB.id, new Date().getMonth() + 1, new Date().getFullYear());

    if (txB.length !== 0) {
        console.error(`❌ DATA LEAK! User B sees ${txB.length} transactions!`);
        console.error(txB);
    } else {
        console.log("✅ User B sees 0 transactions (Isolation Success).");
    }

    // Checking budgets (might have sample budgets created automatically in getBudgets)
    // The ensureSampleBudgets creates 3 budgets if < 3.
    // So User B might see 3 budgets. But they should NOT see User A's budget (amount 5,000,000).
    const leakedBudget = budgetsB.find(b => b.amount === 5000000);
    if (leakedBudget) {
        console.error("❌ DATA LEAK! User B sees User A's 5M budget!");
    } else {
        console.log("✅ User B does not see User A's budget (Isolation Success).");
    }

    console.log("🎉 Verification Complete!");
}

verifyIsolation().catch(console.error);
