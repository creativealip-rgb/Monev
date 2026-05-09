import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { unlockAchievement } from "@/backend/services/achievementService";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { achievementCode } = body;

    if (!achievementCode) {
      return NextResponse.json(
        { error: "achievementCode is required" },
        { status: 400 }
      );
    }

    const result = await unlockAchievement(parseInt(session.user.id), achievementCode);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return NextResponse.json(
      { error: "Failed to unlock achievement" },
      { status: 500 }
    );
  }
}
