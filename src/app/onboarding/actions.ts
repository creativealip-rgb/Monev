"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { userSettings, transactions, categories } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { hashPin } from "@/lib/security";

export async function completeOnboardingAction(formData: {
    currency: string;
    language: string;
    pin: string;
    notifications: boolean;
    initialBalance: number;
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
                hourlyRate: 50000,
                hideBalance: false,
            });
        }

        // 3. Create Initial Balance Transaction if balance > 0
        if (formData.initialBalance > 0) {
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

            await db.insert(transactions).values({
                userId,
                amount: formData.initialBalance,
                description: "Saldo Awal",
                type: "income",
                categoryId: incomeCategory.id,
                date: new Date(),
                isVerified: true,
            });
        }

        revalidatePath("/dashboard");
        revalidatePath("/profile");

        return { success: true };
    } catch (error) {
        console.error("Onboarding Completion Error:", error);
        return { success: false, message: "Gagal menyimpan konfigurasi." };
    }
}
