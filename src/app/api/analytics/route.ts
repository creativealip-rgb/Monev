import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAnalysisData, getFinancialHealthMetrics } from "@/backend/db/operations";
import { getFinancialInsights } from "@/lib/ai";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const searchParams = req.nextUrl.searchParams;
        const now = new Date();
        const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || now.getFullYear().toString());

        const data = await getAnalysisData(userId, year, month);
        const health = await getFinancialHealthMetrics(userId);

        // Generate AI insights based on the analysis data
        const insights = await getFinancialInsights(data);

        return NextResponse.json({
            ...data,
            health,
            insights
        });
    } catch (error: any) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
