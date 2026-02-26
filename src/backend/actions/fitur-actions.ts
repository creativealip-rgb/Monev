"use server";

import { auth } from "@/auth";
import { getUserById } from "@/backend/db/operations";

export async function fetchNotificationConfig() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }
    const userId = parseInt(session.user.id);
    const user = await getUserById(userId);

    return {
        apiKey: process.env.NOTIFICATION_API_KEY || "NOT_SET",
        telegramId: user?.telegramId || null,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notification-webhook`
    };
}
