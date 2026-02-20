import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// In-memory store for development. In production, use a proper database table.
// You'd add a `pushSubscriptions` table to your Drizzle schema.
const subscriptions = new Map<string, { userId: number; subscription: PushSubscription }>();

interface PushSubscription {
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

        const subscription = await req.json() as PushSubscription;

        if (!subscription.endpoint) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // Store subscription (keyed by endpoint for easy lookup)
        subscriptions.set(subscription.endpoint, { userId, subscription });

        console.log(`[Push] User ${userId} subscribed: ${subscription.endpoint.slice(0, 50)}...`);

        return NextResponse.json({
            success: true,
            message: "Push subscription saved",
        });
    } catch (error) {
        console.error("[Push] Subscribe error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
