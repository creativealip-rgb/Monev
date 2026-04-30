import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { userSettings, transactions, categories, accounts } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { hashPin } from "@/lib/security";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const db = getDb();
        const formData = await req.json();

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
                hasCompletedOnboarding: true,
            });
        }

        // 3. Create Initial Balance Account and Transaction if balance > 0
        const initialBalance = Number(formData.initialBalance);
        if (Number.isFinite(initialBalance) && initialBalance > 0) {
            const initialAccount = await db.insert(accounts).values({
                userId,
                name: "Saldo Awal",
                type: "cash",
                balance: initialBalance,
                color: "#2563eb",
                icon: "Wallet",
            }).returning().get();

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

            if (incomeCategory) {
                await db.insert(transactions).values({
                    userId,
                    amount: initialBalance,
                    description: "Saldo Awal",
                    type: "income",
                    categoryId: incomeCategory.id,
                    accountId: initialAccount.id,
                    paymentMethod: "cash",
                    date: new Date(),
                    isVerified: true,
                });
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/profile");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Onboarding Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
