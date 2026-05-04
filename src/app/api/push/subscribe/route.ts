import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { savePushSubscription } from "@/backend/db/operations/push-operations";

interface PushSubscriptionPayload {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const subscription = await req.json() as PushSubscriptionPayload;

        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // Persist subscription to database (upsert by endpoint)
        const subscriptionId = await savePushSubscription(
            userId,
            subscription,
            req.headers.get("user-agent") || undefined
        );

        console.log(`[Push] User ${userId} subscribed (id: ${subscriptionId}): ${subscription.endpoint.slice(0, 50)}...`);

        return NextResponse.json({
            success: true,
            message: "Push subscription saved",
            subscriptionId,
        });
    } catch (error) {
        console.error("[Push] Subscribe error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
