import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getChatHistory } from "@/backend/db/operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = parseInt(session.user.id);
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const messages = await getChatHistory(userId, limit);

        return NextResponse.json({ success: true, data: messages });
    } catch (error: unknown) {
        console.error("Chat History API Error:", error);
        return NextResponse.json(
            { success: false, error: "Gagal memuat riwayat chat" },
            { status: 500 }
        );
    }
}
