import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, transactions, budgets, goals, categories, accounts, bills, userSettings, chatHistory, investments, recurringTransactions, streaks, achievements, userAchievements, sessions } from "@/backend/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        // Simple security check: Verify if CRON_SECRET is present (if you have it in .env)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        // }

        const db = getDb();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find users who requested deletion more than 30 days ago
        const usersToDelete = await db.select()
            .from(users)
            .where(and(
                eq(users.isActive, false),
                lt(users.deletionRequestedAt, thirtyDaysAgo)
            ))
            .all();

        if (usersToDelete.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No accounts found for cleanup.",
                count: 0
            });
        }

        const deletePromises = usersToDelete.map(async (user) => {
            const userId = user.id;

            // Delete all user related data
            await db.delete(transactions).where(eq(transactions.userId, userId));
            await db.delete(budgets).where(eq(budgets.userId, userId));
            await db.delete(goals).where(eq(goals.userId, userId));
            await db.delete(categories).where(eq(categories.userId, userId));
            await db.delete(accounts).where(eq(accounts.userId, userId));
            await db.delete(bills).where(eq(bills.userId, userId));
            await db.delete(userSettings).where(eq(userSettings.userId, userId));
            await db.delete(chatHistory).where(eq(chatHistory.userId, userId));
            await db.delete(investments).where(eq(investments.userId, userId));
            await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
            await db.delete(streaks).where(eq(streaks.userId, userId));
            await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
            await db.delete(sessions).where(eq(sessions.userId, userId));

            // Finally delete the user
            await db.delete(users).where(eq(users.id, userId));

            console.log(`Permanently deleted user ID: ${userId}`);
        });

        await Promise.all(deletePromises);

        return NextResponse.json({
            success: true,
            message: `Cleanup completed. Permanently deleted ${usersToDelete.length} accounts.`,
            count: usersToDelete.length
        });

    } catch (error: any) {
        console.error("Cleanup Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
