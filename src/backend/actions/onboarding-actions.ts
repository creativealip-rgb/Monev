"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { userSettings, transactions, categories, budgets, accounts } from "@/backend/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { hashPin } from "@/lib/security";

type BudgetRecommendationInput = {
    category: string;
    amount: number;
    percentage?: number;
};

type OnboardingAccountInput = {
    name: string;
    type: "bank" | "ewallet" | "cash";
    balance: number;
};

const BUDGET_CATEGORY_META: Record<string, { name: string; color: string; icon: string }> = {
    Makanan: { name: "Makan & Minuman", color: "#f97316", icon: "Utensils" },
    Transport: { name: "Transportasi", color: "#3b82f6", icon: "Car" },
    Tagihan: { name: "Tagihan", color: "#8b5cf6", icon: "Receipt" },
    Kesehatan: { name: "Kesehatan", color: "#10b981", icon: "HeartPulse" },
    Belanja: { name: "Belanja", color: "#ec4899", icon: "ShoppingBag" },
    Hiburan: { name: "Hiburan", color: "#f59e0b", icon: "Gamepad2" },
    Langganan: { name: "Langganan", color: "#6366f1", icon: "Repeat" },
    Tabungan: { name: "Tabungan", color: "#14b8a6", icon: "PiggyBank" },
};

async function upsertOpeningBalanceAccount(userId: number, data: {
    name: string;
    type: "bank" | "emoney" | "cash";
    balance: number;
    color: string;
    icon: string;
    categoryId?: number;
}) {
    const db = getDb();
    const description = data.name === "Saldo Awal" ? "Saldo Awal" : `Saldo Awal ${data.name}`;
    const existingAccount = await db.select()
        .from(accounts)
        .where(and(
            eq(accounts.userId, userId),
            eq(accounts.name, data.name),
            eq(accounts.type, data.type)
        ))
        .get();

    const account = existingAccount || await db.insert(accounts).values({
        userId,
        name: data.name,
        type: data.type,
        balance: data.balance,
        color: data.color,
        icon: data.icon,
    }).returning().get();

    const existingOpeningTransaction = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.accountId, account.id),
            eq(transactions.description, description),
            eq(transactions.merchantName, "Saldo Awal"),
            eq(transactions.paymentMethod, "adjustment")
        ))
        .get();

    const previousOpeningBalance = existingOpeningTransaction
        ? (existingOpeningTransaction.type === "expense" ? -existingOpeningTransaction.amount : existingOpeningTransaction.amount)
        : 0;
    const delta = data.balance - previousOpeningBalance;

    if (existingAccount && delta !== 0) {
        await db.update(accounts)
            .set({ balance: sql`${accounts.balance} + ${delta}`, updatedAt: new Date() })
            .where(eq(accounts.id, account.id));
    }

    if (data.balance <= 0) {
        return account;
    }

    const transactionValues = {
        userId,
        accountId: account.id,
        amount: Math.abs(data.balance),
        description,
        merchantName: "Saldo Awal",
        type: data.balance >= 0 ? "income" as const : "expense" as const,
        paymentMethod: "adjustment",
        date: new Date(),
        isVerified: true,
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
    };

    if (existingOpeningTransaction) {
        await db.update(transactions)
            .set(transactionValues)
            .where(eq(transactions.id, existingOpeningTransaction.id));
        return account;
    }

    await db.insert(transactions).values(transactionValues);
    return account;
}

export async function completeOnboardingAction(formData: {
    currency: string;
    language: string;
    pin: string;
    notifications: boolean;
    initialBalance: number;
    monthlyIncome?: number;
    accounts?: OnboardingAccountInput[];
    budgetRecommendations?: BudgetRecommendationInput[];
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }
    const userId = parseInt(session.user.id);
    const db = getDb();

    try {
        // 1. Hash PIN if provided
        let hashedPin: string | null = null;
        if (formData.pin && formData.pin.length === 6) {
            hashedPin = await hashPin(formData.pin);
        }

        // 2. Update or Create User Settings
        const existingSettings = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .get();

        if (existingSettings) {
            await db.update(userSettings)
                .set({
                    monthlyIncome: formData.monthlyIncome || 0,
                    securityPin: hashedPin,
                    isAppLockEnabled: !!hashedPin,
                    notificationsEnabled: formData.notifications,
                    hasCompletedOnboarding: true,
                    updatedAt: new Date(),
                })
                .where(eq(userSettings.userId, userId));
        } else {
            await db.insert(userSettings).values({
                userId,
                securityPin: hashedPin,
                isAppLockEnabled: !!hashedPin,
                notificationsEnabled: formData.notifications,
                monthlyIncome: formData.monthlyIncome || 0,
                hourlyRate: 50000,
                hideBalance: false,
                hasCompletedOnboarding: true,
            });
        }

        const accountInputs = Array.isArray(formData.accounts) ? formData.accounts : [];

        // Idempotent opening balance setup: rerunning onboarding updates previous
        // opening entries instead of creating duplicate accounts/transactions.
        for (const accountInput of accountInputs) {
            const balance = Number(accountInput.balance) || 0;
            if (!accountInput.name || balance < 0) continue;

            await upsertOpeningBalanceAccount(userId, {
                name: accountInput.name,
                type: accountInput.type === "ewallet" ? "emoney" : accountInput.type,
                balance,
                color: "#3b82f6",
                icon: accountInput.type === "cash" ? "Wallet" : "CreditCard",
            });
        }

        // 3. Create or update default cash account and initial balance transaction if balance > 0
        if (formData.initialBalance > 0 && accountInputs.length === 0) {
            // Find or create an income category
            let incomeCategory = await db.select()
                .from(categories)
                .where(eq(categories.name, "Pemasukan"))
                .get();

            if (!incomeCategory) {
                incomeCategory = await db.insert(categories).values({
                    name: "Pemasukan",
                    type: "income",
                    color: "#10b981",
                    icon: "Wallet",
                }).returning().get();
            }

            await upsertOpeningBalanceAccount(userId, {
                name: "Saldo Awal",
                type: "cash",
                balance: formData.initialBalance,
                color: "#10b981",
                icon: "Wallet",
                categoryId: incomeCategory.id,
            });
        }

        const budgetRecommendations = formData.budgetRecommendations || [];
        if (budgetRecommendations.length > 0) {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            for (const budgetInput of budgetRecommendations) {
                const amount = Number(budgetInput.amount) || 0;
                if (amount <= 0) continue;

                const meta = BUDGET_CATEGORY_META[budgetInput.category] || {
                    name: budgetInput.category,
                    color: "#64748b",
                    icon: "Wallet",
                };

                let category = await db.select()
                    .from(categories)
                    .where(eq(categories.name, meta.name))
                    .get();

                if (!category) {
                    category = await db.insert(categories).values({
                        userId,
                        name: meta.name,
                        type: "expense",
                        color: meta.color,
                        icon: meta.icon,
                    }).returning().get();
                }

                const existingBudget = await db.select()
                    .from(budgets)
                    .where(and(
                        eq(budgets.userId, userId),
                        eq(budgets.categoryId, category.id),
                        eq(budgets.month, month),
                        eq(budgets.year, year)
                    ))
                    .get();

                if (existingBudget) {
                    await db.update(budgets)
                        .set({ amount })
                        .where(eq(budgets.id, existingBudget.id));
                } else {
                    await db.insert(budgets).values({
                        userId,
                        categoryId: category.id,
                        amount,
                        month,
                        year,
                    });
                }
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/profile");

        return { success: true };
    } catch (error) {
        console.error("Onboarding Completion Error:", error);
        return { success: false, message: "Gagal menyimpan konfigurasi." };
    }
}
