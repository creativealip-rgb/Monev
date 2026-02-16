import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMonthlyStats } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        const stats = await getMonthlyStats(userId, year, month);

        // Fetch total assets for comprehensive balance
        const { getAssetsValue } = await import("@/backend/db/operations");
        const assets = await getAssetsValue(userId);

        // Get previous month stats for comparison
        let prevYear = year;
        let prevMonth = month - 1;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        const prevStats = await getMonthlyStats(userId, prevYear, prevMonth);

        // Calculate growth percentage
        let growth = 0;
        if (prevStats.balance !== 0) {
            growth = ((stats.balance - prevStats.balance) / Math.abs(prevStats.balance)) * 100;
        } else if (stats.balance !== 0) {
            growth = 100; // From 0 to something is considered 100% growth
        }

        return NextResponse.json({ success: true, data: { ...stats, ...assets, growth } });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
