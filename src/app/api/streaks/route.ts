import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserStreak } from "@/backend/db/operations";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);

    const streak = await getUserStreak(userId);

    return NextResponse.json({
        success: true,
        data: streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastTransactionDate: null,
        }
    });
}
