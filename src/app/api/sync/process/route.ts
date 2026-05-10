import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueSyncMutation, processPendingSyncMutations } from "@/backend/db/operations";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id, 10);
        const body = await request.json().catch(() => ({}));
        const mutations = Array.isArray(body.mutations) ? body.mutations : [];

        for (const mutation of mutations) {
            if (!mutation?.clientMutationId || !mutation?.entityType || !mutation?.operation) continue;
            await enqueueSyncMutation(userId, {
                clientMutationId: String(mutation.clientMutationId),
                entityType: String(mutation.entityType),
                operation: String(mutation.operation),
                payload: mutation.payload || {},
            });
        }

        const processed = await processPendingSyncMutations(userId);
        return NextResponse.json({ success: true, data: { enqueued: mutations.length, processed: processed.length } });
    } catch (error) {
        console.error("Sync process error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
