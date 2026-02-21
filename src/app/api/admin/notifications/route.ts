import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, adminActivityLog } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";

interface PushSubscriptionJSON {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

const pushSubscriptions = new Map<string, { userId: number; subscription: PushSubscriptionJSON }>();

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();
        const currentUserId = parseInt(session.user.id);
        
        const adminCheck = await db.select({ isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.id, currentUserId))
            .get();

        if (!adminCheck?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const notificationsHistory = await db.select({
            id: adminActivityLog.id,
            action: adminActivityLog.action,
            details: adminActivityLog.details,
            createdAt: adminActivityLog.createdAt,
        })
            .from(adminActivityLog)
            .where(eq(adminActivityLog.action, "send_notification"))
            .orderBy(sql`created_at DESC`)
            .limit(20)
            .all();

        const parsedHistory = notificationsHistory.map((item) => {
            let parsedDetails = {};
            try {
                parsedDetails = item.details ? JSON.parse(item.details) : {};
            } catch (e) {}
            return {
                ...item,
                details: parsedDetails,
            };
        });

        return NextResponse.json({
            success: true,
            data: parsedHistory,
        });
    } catch (error) {
        console.error("[Admin Notifications GET] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();
        const currentUserId = parseInt(session.user.id);
        
        const adminCheck = await db.select({ isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.id, currentUserId))
            .get();

        if (!adminCheck?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { message, target, tier } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        if (message.length > 500) {
            return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
        }

        let userIds: number[] = [];

        if (target === "all") {
            const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true)).all();
            userIds = allUsers.map(u => u.id);
        } else if (target === "tier" && tier) {
            if (!["miskin", "kaya", "sultan"].includes(tier)) {
                return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
            }
            const tierUsers = await db.select({ id: users.id })
                .from(users)
                .where(eq(users.tier, tier as "miskin" | "kaya" | "sultan"))
                .all();
            userIds = tierUsers.map(u => u.id);
        }

        const subscriptions = [];
        for (const userId of userIds) {
            for (const [endpoint, sub] of pushSubscriptions.entries()) {
                if (sub.userId === userId) {
                    subscriptions.push(sub.subscription);
                }
            }
        }

        let successCount = 0;
        let failedCount = 0;

        for (const subscription of subscriptions) {
            try {
                await sendPushNotification(subscription, message);
                successCount++;
            } catch (error) {
                console.error("[Push] Failed to send:", error);
                failedCount++;
            }
        }

        await db.insert(adminActivityLog).values({
            adminId: currentUserId,
            action: "send_notification",
            targetType: target,
            details: JSON.stringify({
                message,
                target,
                tier,
                userCount: userIds.length,
                successCount,
                failedCount,
            }),
        });

        return NextResponse.json({
            success: true,
            data: {
                target,
                tier,
                totalRecipients: userIds.length,
                subscriptionsFound: subscriptions.length,
                successCount,
                failedCount,
            },
        });
    } catch (error) {
        console.error("[Admin Notifications POST] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

async function sendPushNotification(subscription: PushSubscriptionJSON, message: string) {
    console.log("[Push] Would send notification to:", subscription.endpoint);
    console.log("[Push] Message:", message);
    return true;
}
