import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById } from "@/backend/db/operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const user = await getUserById(userId);

        return NextResponse.json({
            success: true,
            data: {
                apiKey: process.env.NOTIFICATION_API_KEY || "NOT_SET",
                telegramId: user?.telegramId || null,
                webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notification-webhook`
            }
        });
    } catch (error: any) {
        console.error("API Notification Config Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
