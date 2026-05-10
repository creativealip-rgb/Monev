import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { upsertRecurringSuggestionState } from "@/backend/db/operations";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const patternKey = typeof body.patternKey === "string" ? body.patternKey.trim() : "";
        if (!patternKey) {
            return NextResponse.json({ success: false, error: "patternKey is required" }, { status: 400 });
        }

        const data = await upsertRecurringSuggestionState(parseInt(session.user.id, 10), patternKey, "dismissed");
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Dismiss recurring suggestion error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
