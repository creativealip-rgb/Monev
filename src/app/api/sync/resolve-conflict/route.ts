import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveSyncConflict } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const resolveConflictSchema = z.object({
    conflictId: z.coerce.number().int().positive(),
    resolution: z.enum(["use_local", "use_server", "merge"]),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = resolveConflictSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid conflictId and resolution are required" }, { status: 400 });
        }

        const data = await resolveSyncConflict(
            parseInt(session.user.id, 10),
            parsedBody.data.conflictId,
            parsedBody.data.resolution,
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Resolve sync conflict error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
