import { NextRequest, NextResponse } from "next/server";
import { rolloverAllUsers } from "@/backend/db/budget-operations";
import { sendPushToUser } from "@/lib/send-push";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Rollover from last month to current month
        let lastMonth = currentMonth - 1;
        let lastMonthYear = currentYear;

        if (lastMonth === 0) {
            lastMonth = 12;
            lastMonthYear = currentYear - 1;
        }

        const results = await rolloverAllUsers(lastMonth, lastMonthYear, currentMonth, currentYear);

        // Send push notifications to affected users
        if (Array.isArray(results)) {
            const userIds = [...new Set(results.map((r: { userId?: number }) => r.userId).filter(Boolean))] as number[];
            for (const userId of userIds) {
                try {
                    await sendPushToUser(userId, {
                        title: "Monev",
                        body: "Budget bulan baru sudah siap. Yuk cek budget kamu!",
                        url: "/budgets",
                        tag: "budget-rollover",
                    }, "budget_alert");
                } catch (pushError) {
                    console.error(`[budget-rollover] Push failed for user ${userId}:`, pushError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Budget rollover processed for all users.",
            results
        });

    } catch (error: any) {
        console.error("Budget Rollover Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
