import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotificationLogs, markAllNotificationsAsRead } from "@/backend/db/operations/push-operations";

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

        const userId = parseInt(session.user.id);
        const { action } = await request.json();

        if (action === "markAllAsRead") {
            await markAllNotificationsAsRead(userId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("API Error (Notifications POST):", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
