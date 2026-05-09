import { getDb } from "../index";
import { investments, categories, transactions } from "../schema";
import type { Investment, Category, Transaction } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getGoals } from "./goal-operations";
import { updateAccountBalance } from "../account-operations";
import { unlockAchievement } from "./gamification-operations";

const ADMIN_FEE_PERCENTAGE = 0.02; // 2% admin fee

// Helper to get total assets
export async function getAssetsValue(userId: number): Promise<{ totalGoals: number, totalInvestments: number }> {
    const goalsList = await getGoals(userId);
    const totalGoals = goalsList.reduce((acc, g) => acc + g.currentAmount, 0);

    const investmentsList = await getInvestments(userId);
    const totalInvestments = investmentsList.reduce((acc, i) => acc + (i.quantity * i.currentPrice), 0);

    return {
        totalGoals,
        totalInvestments
    };
}

export async function getInvestments(userId: number): Promise<Investment[]> {
    const db = getDb();
    return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.createdAt)).all();
}

export async function getInvestmentById(userId: number, id: number): Promise<Investment | undefined> {
    const db = getDb();
    return db.select().from(investments).where(and(eq(investments.id, id), eq(investments.userId, userId))).get();
}

export async function createInvestment(userId: number, data: {
    name: string;
    type: "stock" | "crypto" | "mutual_fund" | "gold" | "bond" | "other";
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    platform?: string;
    totalDividends?: number;
    realizedProfit?: number;
    icon?: string;
    color?: string;
    notes?: string;
}): Promise<Investment> {
    const db = getDb();
    const result = await db.insert(investments).values({
        userId,
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        avgBuyPrice: data.avgBuyPrice,
        currentPrice: data.currentPrice,
        platform: data.platform || null,
        icon: data.icon || "TrendingUp",
        color: data.color || "#10b981",
        notes: data.notes || null,
    }).returning();

    if (result && result[0]) {
        await unlockAchievement(userId, "first_invest");
    }

    return result[0];
}

export async function updateInvestment(userId: number, id: number, data: Partial<Investment>): Promise<Investment | undefined> {
    const db = getDb();
    const result = await db.update(investments)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(eq(investments.id, id), eq(investments.userId, userId)))
        .returning();
    return result[0];
}

export async function deleteInvestment(userId: number, id: number): Promise<void> {
    const db = getDb();
    await db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

export async function ensureSampleInvestments(userId: number): Promise<void> {
    const db = getDb();
    const existing = await db.select().from(investments).where(eq(investments.userId, userId)).all();
    if (existing.length > 0) return;

    await db.insert(investments).values([
        { userId, name: "BBCA", type: "stock", quantity: 500, avgBuyPrice: 9200, currentPrice: 10500, platform: "Ajaib", icon: "BarChart", color: "#3b82f6" },
        { userId, name: "Emas Antam", type: "gold", quantity: 5, avgBuyPrice: 1100000, currentPrice: 1350000, platform: "Pegadaian", icon: "Award", color: "#eab308" },
    ]);
}

export async function getInvestmentsSummary(userId: number) {
    const allInvestments = await getInvestments(userId);

    let totalValue = 0;
    let totalCost = 0;
    let totalDividends = 0;
    let totalRealizedProfit = 0;
    const allocation: Record<string, { label: string, value: number, color: string }> = {};

    allInvestments.forEach(inv => {
        const value = inv.quantity * inv.currentPrice;
        const cost = inv.quantity * inv.avgBuyPrice;
        totalValue += value;
        totalCost += cost;
        totalDividends += (inv.totalDividends || 0);
        totalRealizedProfit += (inv.realizedProfit || 0);

        if (!allocation[inv.type]) {
            const labels: Record<string, string> = {
                stock: "Saham",
                crypto: "Crypto",
                mutual_fund: "Reksadana",
                gold: "Emas",
                bond: "Obligasi",
                other: "Lainnya"
            };
            allocation[inv.type] = {
                label: labels[inv.type] || inv.type,
                value: 0,
                color: inv.color
            };
        }
        allocation[inv.type].value += value;
    });

    const totalUnrealizedProfit = totalValue - totalCost;
    const totalProfit = totalUnrealizedProfit + totalDividends + totalRealizedProfit;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
        totalValue,
        totalCost,
        totalProfit,
        totalDividends,
        profitPercent,
        allocation: Object.values(allocation),
        items: allInvestments
    };
}

export async function transferToInvestment(userId: number, investmentId: number, amount: number, description?: string, accountId?: number): Promise<Transaction | undefined> {
    const db = getDb();

    const investment = await getInvestmentById(userId, investmentId);
    if (!investment) return undefined;

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const netAmount = amount - fee;
    const newQuantity = investment.quantity + (netAmount / investment.avgBuyPrice);

    await db.update(investments)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)));

    // Update source account balance if accountId provided
    if (accountId) {
        const fee = Math.round(amount * 0.02);
        const totalDeduction = amount + fee;
        await updateAccountBalance(userId, accountId, -totalDeduction);
    }

    const cats = db.select().from(categories).all();
    const investasiCat = cats.find((c: Category) => c.name === "Investasi");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Buy ${investment.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "transfer",
        categoryId: investasiCat?.id,
        destinationType: "investment",
        destinationId: investmentId,
        paymentMethod: "transfer",
        fee,
        date: new Date(),
        isVerified: true,
    }).returning().get();

    return transaction;
}

export async function withdrawFromInvestment(userId: number, investmentId: number, amount: number, description?: string, targetAccountId?: number): Promise<Transaction | undefined> {
    const db = getDb();

    const investment = await getInvestmentById(userId, investmentId);
    if (!investment) return undefined;

    // Calculate max withdrawable amount based on current value
    const currentValue = investment.quantity * investment.currentPrice;
    if (currentValue < amount) {
        throw new Error("Insufficient investment value");
    }

    const fee = amount * ADMIN_FEE_PERCENTAGE;
    const sellQuantity = amount / investment.currentPrice;
    const newQuantity = investment.quantity - sellQuantity;

    await db.update(investments)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)));

    const cats = db.select().from(categories).all();
    const investasiCat = cats.find((c: Category) => c.name === "Investasi");

    const transaction = await db.insert(transactions).values({
        userId,
        amount,
        description: description || `Sell ${investment.name} (Fee: ${fee.toLocaleString('id-ID')})`,
        type: "withdraw",
        categoryId: investasiCat?.id,
        sourceType: "investment",
        sourceId: investmentId,
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

export async function getTotalInvestmentsValue(userId: number): Promise<number> {
    const db = getDb();
    const result = await db
        .select({ total: sql<number>`SUM(${investments.quantity} * ${investments.currentPrice})` })
        .from(investments)
        .where(eq(investments.userId, userId))
        .get();
    return result?.total || 0;
}
