import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, transactions, budgets, goals, categories, accounts, bills, userSettings } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { action, confirmText } = body;

        if (action === "request_deletion") {
            // Request account deletion with typing verification
            if (confirmText !== "HAPUS") {
                return NextResponse.json({
                    success: false,
                    error: "Ketik 'HAPUS' untuk melanjutkan"
                }, { status: 400 });
            }

            const db = getDb();

            // Set deletion date to 30 days from now
            const deletionDate = new Date();
            deletionDate.setDate(deletionDate.getDate() + 30);

            // Update user record with deletion request
            await db.update(users)
                .set({
                    isActive: false,
                    deletionRequestedAt: new Date(),
                    email: null, // Anonymize email
                    name: "Deleted User",
                    image: null
                })
                .where(eq(users.id, userId));

            return NextResponse.json({
                success: true,
                message: "Permintaan penghapusan akun telah diajukan. Akun akan dihapus dalam 30 hari.",
                deletionDate: deletionDate.toISOString()
            });
        }

        if (action === "cancel_deletion") {
            // Cancel deletion request
            const db = getDb();

            await db.update(users)
                .set({
                    isActive: true,
                    deletionRequestedAt: null
                })
                .where(eq(users.id, userId));

            return NextResponse.json({
                success: true,
                message: "Permintaan penghapusan akun dibatalkan."
            });
        }

        if (action === "permanent_delete") {
            // Permanent delete (admin only, or after grace period)
            const db = getDb();

            // Delete all user data
            await db.delete(transactions).where(eq(transactions.userId, userId));
            await db.delete(budgets).where(eq(budgets.userId, userId));
            await db.delete(goals).where(eq(goals.userId, userId));
            await db.delete(categories).where(eq(categories.userId, userId));
            await db.delete(accounts).where(eq(accounts.userId, userId));
            await db.delete(bills).where(eq(bills.userId, userId));
            await db.delete(userSettings).where(eq(userSettings.userId, userId));

            // Delete user
            await db.delete(users).where(eq(users.id, userId));

            return NextResponse.json({
                success: true,
                message: "Akun telah dihapus secara permanen."
            });
        }

        return NextResponse.json({
            success: false,
            error: "Invalid action"
        }, { status: 400 });

    } catch (error: any) {
        console.error("Account Deletion API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
