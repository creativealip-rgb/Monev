import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGoalInsights } from "@/backend/db/goal-operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(req.url);
        const goalId = searchParams.get("goalId");

        if (!goalId) {
            return NextResponse.json({ success: false, error: "Goal ID is required" }, { status: 400 });
        }

        const insights = await getGoalInsights(userId, parseInt(goalId));

        if (!insights) {
            return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: insights
        });

    } catch (error: any) {
        console.error("Goal Insights API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
