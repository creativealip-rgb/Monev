import { getDb } from "./index";
import { goals, transactions, accounts, users } from "./schema";
import { eq, and, sql } from "drizzle-orm";
import { updateAccountBalance } from "./account-operations";

/**
 * Apply a goal template for a user.
 */
export async function applyGoalTemplate(userId: number, template: "emergency-fund" | "home-downpayment" | "vacation") {
    const db = getDb();

    let goalData = null;

    if (template === "emergency-fund") {
        // Assume 6x monthly expenses (we'd need to calculate this, but let's use a default for now)
        goalData = {
            userId,
            name: "Emergency Fund (Dana Darurat)",
            targetAmount: 30000000, // Default 30jt
            icon: "ShieldCheck",
            color: "#ef4444"
        };
    } else if (template === "home-downpayment") {
        goalData = {
            userId,
            name: "DP Rumah",
            targetAmount: 100000000, // 100jt
            icon: "Home",
            color: "#3b82f6"
        };
    } else if (template === "vacation") {
        goalData = {
            userId,
            name: "Liburan Akhir Tahun",
            targetAmount: 15000000, // 15jt
            icon: "Plane",
            color: "#10b981"
        };
    }

    if (goalData) {
        return db.insert(goals).values(goalData).returning().get();
    }

    return null;
}

/**
 * Executes auto-transfer from a primary account to a specific goal.
 */
export async function executeAutoTransfer(userId: number, goalId: number, amount: number, sourceAccountId: number) {
    const db = getDb();

    // 1. Get the goal and account
    const goal = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).get();
    const account = await db.select().from(accounts).where(and(eq(accounts.id, sourceAccountId), eq(accounts.userId, userId))).get();

    if (!goal || !account) throw new Error("Goal or Account not found");
    if (account.balance < amount) throw new Error("Insufficient balance for auto-transfer");

    // 2. Create a transaction for the transfer
    await db.insert(transactions).values({
        userId,
        amount,
        description: `Auto-transfer to Goal: ${goal.name}`,
        type: "transfer",
        accountId: sourceAccountId,
        destinationType: "goal",
        destinationId: goalId,
        date: new Date()
    });

    // 3. Update account balance
    await updateAccountBalance(userId, sourceAccountId, -amount);

    // 4. Update goal progress
    const newAmount = goal.currentAmount + amount;
    await db.update(goals)
        .set({ currentAmount: newAmount })
        .where(eq(goals.id, goalId));

    return { success: true, newAmount };
}

/**
 * Calculates insights for a goal.
 */
export async function getGoalInsights(userId: number, goalId: number) {
    const db = getDb();
    const goal = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).get();

    if (!goal) return null;

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    let dailyNeeded = 0;
    let daysRemaining = 0;

    if (goal.deadline) {
        const now = new Date();
        const diffTime = goal.deadline.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining > 0) {
            dailyNeeded = remaining / daysRemaining;
        }
    }

    return {
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remaining,
        daysRemaining,
        dailyNeeded,
        projectedCompletionDate: goal.deadline || "Besok (Tanpa deadline)"
    };
}

/**
 * Checks for and unlocks goal milestones.
 */
export async function checkGoalMilestones(userId: number, goalId: number) {
    const db = getDb();
    const goal = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).get();

    if (!goal) return null;

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const milestones = [
        { threshold: 100, name: "Sang Pemenang", desc: `Berhasil mencapai target: ${goal.name}! 🏆` },
        { threshold: 75, name: "Hampir Sampai", desc: `75% target ${goal.name} tercapai! 🚀` },
        { threshold: 50, name: "Setengah Jalan", desc: `Setengah perjalanan ${goal.name} selesai! 💪` },
        { threshold: 25, name: "Awal yang Bagus", desc: `25% target ${goal.name} tercapai! ✨` },
    ];

    const unlocked = [];
    for (const m of milestones) {
        if (progress >= m.threshold) {
            // In a real app, you'd check if this achievement was already unlocked
            unlocked.push(m);
        }
    }

    return unlocked;
}
