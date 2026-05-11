import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runQuickAddShortcut } from "@/backend/db/operations";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const shortcutId = Number(id);
        if (!Number.isInteger(shortcutId)) {
            return NextResponse.json({ success: false, error: "Invalid shortcut id" }, { status: 400 });
        }

        const data = await runQuickAddShortcut(parseInt(String(session.user.id), 10), shortcutId);
        if (!data) {
            return NextResponse.json({ success: false, error: "Shortcut not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Quick Add Run Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
