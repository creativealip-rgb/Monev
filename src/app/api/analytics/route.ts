import { NextRequest, NextResponse } from "next/server";
import { getAnalysisData } from "@/backend/db/operations";
import { getFinancialInsights } from "@/lib/ai";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const now = new Date();
        const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || now.getFullYear().toString());

        const data = await getAnalysisData(year, month);

        // Generate AI insights based on the analysis data
        const insights = await getFinancialInsights(data);

        return NextResponse.json({
            ...data,
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
