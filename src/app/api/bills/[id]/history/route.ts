import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillHistory } from "@/backend/db/operations";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const id = parseInt(idString);

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }

        const history = await getBillHistory(userId, id);

        return NextResponse.json({ success: true, data: history });
    } catch (error) {
        console.error("Error fetching bill history:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch history" }, { status: 500 });
    }
}
