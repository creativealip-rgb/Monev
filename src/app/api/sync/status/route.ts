import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSyncStatus } from "@/backend/db/operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const data = await getSyncStatus(parseInt(String(session.user.id), 10));
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Sync status error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
