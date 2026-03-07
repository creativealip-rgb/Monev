import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyBudgetTemplate } from "@/backend/db/budget-operations";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { template, monthlyIncome, month, year } = body;

        if (!template || !monthlyIncome || !month || !year) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const result = await applyBudgetTemplate(userId, template, monthlyIncome, month, year);

        return NextResponse.json({
            success: true,
            message: `Budget template '${template}' applied successfully.`,
            data: result
        });

    } catch (error: any) {
        console.error("Budget Templates API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
