import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { userSettings } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const db = getDb();
        const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).get();

        if (!settings) {
            return NextResponse.json({ 
                success: false, 
                error: "Settings not found" 
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                notifications: {
                    dailyReport: settings.dailyReport ?? true,
                    budgetAlert: settings.budgetAlert ?? true,
                    transactionUpdate: settings.transactionUpdate ?? true,
                    billReminder: settings.billReminder ?? true,
                    goalProgress: settings.goalProgress ?? true,
                    promoNews: settings.promoNews ?? false,
                },
                channels: {
                    push: settings.pushEnabled ?? true,
                    email: settings.emailEnabled ?? true,
                    telegram: settings.telegramEnabled ?? false,
                },
                quietHours: {
                    enabled: settings.quietHoursEnabled ?? false,
                    start: settings.quietHoursStart ?? "22:00",
                    end: settings.quietHoursEnd ?? "08:00",
                }
            }
        });
    } catch (error: any) {
        console.error("Notification Settings GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { 
            dailyReport,
            budgetAlert,
            transactionUpdate,
            billReminder,
            goalProgress,
            promoNews,
            pushEnabled,
            emailEnabled,
            telegramEnabled,
            quietHoursEnabled,
            quietHoursStart,
            quietHoursEnd
        } = body;

        const db = getDb();
        
        const updatedSettings = await db.update(userSettings)
            .set({
                dailyReport: dailyReport ?? true,
                budgetAlert: budgetAlert ?? true,
                transactionUpdate: transactionUpdate ?? true,
                billReminder: billReminder ?? true,
                goalProgress: goalProgress ?? true,
                promoNews: promoNews ?? false,
                pushEnabled: pushEnabled ?? true,
                emailEnabled: emailEnabled ?? true,
                telegramEnabled: telegramEnabled ?? false,
                quietHoursEnabled: quietHoursEnabled ?? false,
                quietHoursStart: quietHoursStart ?? "22:00",
                quietHoursEnd: quietHoursEnd ?? "08:00",
            })
            .where(eq(userSettings.userId, userId))
            .returning();

        return NextResponse.json({
            success: true,
            message: "Pengaturan notifikasi berhasil diperbarui",
            data: updatedSettings[0]
        });
    } catch (error: any) {
        console.error("Notification Settings POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
