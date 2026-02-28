import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserAchievements } from "@/backend/db/operations";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);

    const achievements = await getUserAchievements(userId);

    return NextResponse.json({ success: true, data: achievements });
}
