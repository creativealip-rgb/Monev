import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSettings, updateUserSettings } from "@/backend/db/operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const settings = await getUserSettings(userId);
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const data = await req.json();
        const { notifications, reports, ...directSettings } = data;
        const notificationPrefs = notifications || {};
        const reportPrefs = reports || {};
        const updatePayload = Object.fromEntries(Object.entries({
            ...directSettings,
            dailyReminder: notificationPrefs.dailyReport,
            budgetAlert: notificationPrefs.budgetAlert,
            transactionUpdate: notificationPrefs.transactionUpdate,
            promoNews: notificationPrefs.promoNews,
            pushEnabled: notificationPrefs.pushEnabled,
            monthlyReportEmail: reportPrefs.monthlyReportEmail,
            monthlyReportTelegram: reportPrefs.monthlyReportTelegram,
            weeklyInsightTelegram: reportPrefs.weeklyInsightTelegram,
            reportLocale: reportPrefs.reportLocale,
        }).filter(([, value]) => value !== undefined)) as Parameters<typeof updateUserSettings>[1];

        const settings = await updateUserSettings(userId, updatePayload);

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
