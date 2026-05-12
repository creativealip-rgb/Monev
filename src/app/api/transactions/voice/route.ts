export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processVoice } from "@/lib/ai";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { canAccessSmartInput, UserTier } from "@/lib/tier-gate";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userTier: UserTier = session.user.tier || "starter";
    if (!canAccessSmartInput(userTier)) {
        return NextResponse.json(
            { success: false, error: "Fitur AI ini khusus user Pro/Sultan." },
            { status: 403 }
        );
    }

    // Rate limiting - AI endpoint
    const rateLimitResponse = await applyRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: "No audio file provided" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const result = await processVoice(buffer);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Voice Error:", error);
        return NextResponse.json(
            { success: false, error: "Voice processing failed" },
            { status: 500 }
        );
    }
}
