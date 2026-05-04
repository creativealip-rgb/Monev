import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { removePushSubscription } from "@/backend/db/operations/push-operations";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { endpoint } = await req.json();

        if (!endpoint) {
            return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
        }

        // Remove subscription from database
        await removePushSubscription(endpoint);

        console.log(`[Push] User ${session.user.id} unsubscribed: ${endpoint.slice(0, 50)}...`);

        return NextResponse.json({
            success: true,
            message: "Push subscription removed",
        });
    } catch (error) {
        console.error("[Push] Unsubscribe error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
