import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSplitBill } from "@/backend/db/operations";

type AuthSession = { user?: { id?: string | number | null } } | null;

function getUserId(session: AuthSession) {
    return session?.user?.id ? parseInt(String(session.user.id), 10) : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const data = await getUserSplitBill(userId, id);
        if (!data) return NextResponse.json({ success: false, error: "Split bill not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Split Bill detail GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
