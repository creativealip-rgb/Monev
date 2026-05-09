import { getDb } from "../index";
import { goals, userSettings, categories, transactions } from "../schema";
import type { Goal, Category, Transaction } from "../schema";
import { eq, and } from "drizzle-orm";
import { updateAccountBalance } from "../account-operations";
import { unlockAchievement } from "./gamification-operations";

const ADMIN_FEE_PERCENTAGE = 0.02; // 2% admin fee

// Goals - Full CRUD operations
export async function getGoals(userId: number): Promise<Goal[]> {
    const db = getDb();
    return db.select().from(goals).where(eq(goals.userId, userId)).all();
}

export async function getGoalById(userId: number, id: number): Promise<Goal | undefined> {
    const db = getDb();
    return db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).get();
}

export async function createGoal(userId: number, data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: Date;
    icon?: string;
    color?: string;
}): Promise<Goal> {
    const db = getDb();
    const result = db.insert(goals).values({
        ...data,
        userId,
        currentAmount: data.currentAmount || 0,
        icon: data.icon || "Target",
        color: data.color || "#3b82f6",
    }).returning().get();

    if (result) {
        await unlockAchievement(userId, "first_goal");
    }

    return result;
}

export async function updateGoal(userId: number, id: number, data: Partial<Goal>): Promise<Goal | undefined> {
    const db = getDb();
    return db.update(goals)
        .set(data)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning()
        .get();
}

export async function updateGoalProgress(userId: number, id: number, amount: number): Promise<Goal | undefined> {
    const db = getDb();
    const goal = await getGoalById(userId, id);
    if (!goal) return undefined;

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);

    const updated = await db.update(goals)
        .set({ currentAmount: newAmount })
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning()
        .get();

    if (updated && updated.currentAmount >= updated.targetAmount) {
        await unlockAchievement(userId, "goal_reached");
    }

    return updated;
}

export async function removeGoal(userId: number, id: number): Promise<Goal | undefined> {
    const db = getDb();

    await db.update(userSettings)
        .set({ primaryGoalId: null })
        .where(and(eq(userSettings.primaryGoalId, id), eq(userSettings.userId, userId)));

    return db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).returning().get();
}

export async function transferToGoal(userId: number, goalId: number, amount: number, description?: string, accountId?: number): Promise<Transaction | undefined> {
    const db = getDb();

    const goal = await getGoalById(userId, goalId);
    if (!goal) return undefined;

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const netAmount = amount - fee;
    const newAmount = Math.min(goal.currentAmount + netAmount, goal.targetAmount);

    await db.update(goals)
        .set({ currentAmount: newAmount })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

    // Update source account balance if accountId provided
    if (accountId) {
        const fee = Math.round(amount * 0.02);
        const totalDeduction = amount + fee;
        await updateAccountBalance(userId, accountId, -totalDeduction);
    }

    const cats = db.select().from(categories).all();
    const tabunganCat = cats.find((c: Category) => c.name === "Tabungan");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Transfer ke ${goal.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "transfer",
        categoryId: tabunganCat?.id,
        destinationType: "goal",
        destinationId: goalId,
        paymentMethod: "transfer",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    return transaction;
}

export async function withdrawFromGoal(userId: number, goalId: number, amount: number, description?: string, targetAccountId?: number): Promise<Transaction | undefined> {
    const db = getDb();

    const goal = await getGoalById(userId, goalId);
    if (!goal) return undefined;

    // Check if goal has enough balance
    if (goal.currentAmount < amount) {
        throw new Error("Insufficient goal balance");
    }

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const newAmount = goal.currentAmount - amount;

    await db.update(goals)
        .set({ currentAmount: newAmount })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

    const cats = db.select().from(categories).all();
    const tabunganCat = cats.find((c: Category) => c.name === "Tabungan");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Withdraw dari ${goal.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "withdraw",
        categoryId: tabunganCat?.id,
        sourceType: "goal",
        sourceId: goalId,
        paymentMethod: "transfer",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    // Update target account balance if targetAccountId provided (add the net amount after fee)
    if (targetAccountId) {
        const netAmount = amount - fee;
        await updateAccountBalance(userId, targetAccountId, netAmount);
    }

    return transaction;
}
