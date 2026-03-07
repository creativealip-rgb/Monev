import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSpendingVelocity } from "@/backend/db/budget-operations";
import { getBudgets } from "@/backend/db/operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        // Get standard budget data (budget vs actual)
        const budgetComparison = await getBudgets(userId, month, year);

        // Get velocity insights
        const velocity = await getSpendingVelocity(userId, month, year);

        return NextResponse.json({
            success: true,
            data: {
                comparison: budgetComparison,
                velocity: velocity
            }
        });

    } catch (error: any) {
        console.error("Budget Stats API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
