import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { detectRecurringPatterns } from "@/backend/services/recurring-detector";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const data = await detectRecurringPatterns(parseInt(session.user.id, 10));
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Recurring suggestions error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
