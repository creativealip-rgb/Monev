import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyGoalTemplate } from "@/backend/db/goal-operations";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { template } = body;

        if (!template) {
            return NextResponse.json({ success: false, error: "Template name is required" }, { status: 400 });
        }

        const result = await applyGoalTemplate(userId, template);

        return NextResponse.json({
            success: true,
            message: `Goal template '${template}' applied successfully.`,
            data: result
        });

    } catch (error: any) {
        console.error("Goal Templates API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
