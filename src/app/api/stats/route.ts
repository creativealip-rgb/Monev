import { NextResponse } from "next/server";
import { getMonthlyStats } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        
        const stats = await getMonthlyStats(year, month);
        return NextResponse.json({ success: true, data: stats });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
