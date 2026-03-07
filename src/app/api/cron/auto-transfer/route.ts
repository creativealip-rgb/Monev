import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, goals, accounts, userSettings } from "@/backend/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { executeAutoTransfer } from "@/backend/db/goal-operations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const now = new Date();
        const currentDay = now.getDate();

        // 1. Find all users who have auto-transfer scheduled for today
        // (Assuming we store the transfer day in userSettings or similar)
        // For now, let's assume a default: Day 1 of the month (Gajian/Payday default)
        if (currentDay !== 1) {
            return NextResponse.json({
                success: true,
                message: "Auto-transfer only runs on the 1st of the month (Payday default).",
                count: 0
            });
        }

        const allUsers = await db.select().from(users).where(eq(users.isActive, true)).all();

        const summary = [];

        for (const user of allUsers) {
            const settings = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).get();

            if (settings?.primaryGoalId) {
                // Find primary account to transfer from
                const primaryAccount = await db.select().from(accounts)
                    .where(and(eq(accounts.userId, user.id), eq(accounts.type, "bank")))
                    .limit(1)
                    .get();

                if (primaryAccount) {
                    // Execute transfer (e.g., 10% of balance or fixed amount)
                    const transferAmount = primaryAccount.balance * 0.1; // Default 10%

                    if (transferAmount > 1000) { // Min transfer 1k
                        try {
                            await executeAutoTransfer(user.id, settings.primaryGoalId, transferAmount, primaryAccount.id);
                            summary.push({ userId: user.id, status: "success", amount: transferAmount });
                        } catch (e: any) {
                            summary.push({ userId: user.id, status: "failed", error: e.message });
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Auto-transfer processed for ${summary.length} users.`,
            summary
        });

    } catch (error: any) {
        console.error("Auto-Transfer Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
