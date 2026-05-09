import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, users } from "@/backend/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { onboardingPath, demoDataScope } = body;

    const db = getDb();
    await db
      .update(users)
      .set({
        onboardingVersion: "v2",
        onboardingPath: onboardingPath || "quick",
        demoDataLoaded: demoDataScope ? true : false,
        demoDataScope: demoDataScope || null,
      })
      .where(eq(users.id, parseInt(session.user.id)));

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
