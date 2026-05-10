import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getNotificationLogs, markAllNotificationsAsRead } from "@/backend/db/operations/push-operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const notificationActionSchema = z.object({
    action: z.literal("markAllAsRead"),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const notifications = await getNotificationLogs(userId);

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error("API Error (Notifications GET):", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const userId = parseInt(session.user.id);
        const body = await request.json().catch(() => null);
        const parsedBody = notificationActionSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }

        await markAllNotificationsAsRead(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error (Notifications POST):", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
