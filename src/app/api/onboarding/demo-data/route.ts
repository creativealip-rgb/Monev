import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyDemoData } from "@/backend/services/demoDataService";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scope } = body;

    if (!scope || !["quick", "standard", "complete"].includes(scope)) {
      return NextResponse.json(
        { error: "Invalid scope. Must be 'quick', 'standard', or 'complete'" },
        { status: 400 }
      );
    }

    await applyDemoData(parseInt(session.user.id), scope);

    return NextResponse.json({
      success: true,
      message: `Demo data applied with scope: ${scope}`,
    });
  } catch (error) {
    console.error("Error applying demo data:", error);
    return NextResponse.json(
      { error: "Failed to apply demo data" },
      { status: 500 }
    );
  }
}
