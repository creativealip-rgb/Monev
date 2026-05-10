import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveSyncConflict } from "@/backend/db/operations";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const conflictId = Number(body.conflictId);
        const resolution = body.resolution;
        if (!Number.isFinite(conflictId) || !["use_local", "use_server", "merge"].includes(resolution)) {
            return NextResponse.json({ success: false, error: "Valid conflictId and resolution are required" }, { status: 400 });
        }

        const data = await resolveSyncConflict(parseInt(session.user.id, 10), conflictId, resolution);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Resolve sync conflict error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
