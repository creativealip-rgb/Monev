import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { evaluateAndUnlockAchievements, getAchievementProgress } from "@/backend/db/operations";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id, 10);

    await evaluateAndUnlockAchievements(userId);
    const progress = await getAchievementProgress(userId);

    return NextResponse.json({ success: true, data: progress });
}
