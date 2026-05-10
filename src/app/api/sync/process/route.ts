import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { enqueueSyncMutation, processPendingSyncMutations } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const syncMutationSchema = z.object({
    clientMutationId: z.string().trim().min(8).max(120),
    entityType: z.enum(["transaction", "transactions"]),
    operation: z.enum(["create", "update", "delete"]),
    payload: z.record(z.string(), z.unknown()),
});

const syncProcessSchema = z.object({
    mutations: z.array(syncMutationSchema).max(25).default([]),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const userId = parseInt(session.user.id, 10);
        const body = await request.json().catch(() => null);
        const parsedBody = syncProcessSchema.safeParse(body ?? {});
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Invalid sync payload" }, { status: 400 });
        }

        const { mutations } = parsedBody.data;
        for (const mutation of mutations) {
            await enqueueSyncMutation(userId, mutation);
        }

        const processed = await processPendingSyncMutations(userId);
        return NextResponse.json({ success: true, data: { enqueued: mutations.length, processed: processed.length } });
    } catch (error) {
        console.error("Sync process error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
