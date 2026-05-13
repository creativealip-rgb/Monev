import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, adminActivityLog } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendPushToUser } from "@/lib/send-push";

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
        const { message, target, tier, url } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        if (message.length > 500) {
            return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
        }

        const targetUrl = typeof url === "string" && url.trim() ? url.trim() : "/dashboard";
        if (!targetUrl.startsWith("/")) {
            return NextResponse.json({ error: "Link tujuan harus berupa path internal, contoh /pricing" }, { status: 400 });
        }
        if (targetUrl.startsWith("//") || targetUrl.toLowerCase().startsWith("/javascript:")) {
            return NextResponse.json({ error: "Link tujuan tidak valid" }, { status: 400 });
        }
        if (targetUrl.length > 200) {
            return NextResponse.json({ error: "Link tujuan terlalu panjang (max 200 chars)" }, { status: 400 });
        }

        // Get target user IDs
        let userIds: number[] = [];

        if (target === "all") {
            const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true)).all();
            userIds = allUsers.map(u => u.id);
        } else if (target === "tier" && tier) {
            if (!["starter", "pro", "sultan", "benefactor"].includes(tier)) {
                return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
            }
            const tierUsers = await db.select({ id: users.id })
                .from(users)
                .where(eq(users.tier, tier as "starter" | "pro" | "sultan" | "benefactor"))
                .all();
            userIds = tierUsers.map(u => u.id);
        }

        // Send real push notifications using the database-backed sender
        let totalSent = 0;
        let totalFailed = 0;
        let totalSkipped = 0;

        for (const userId of userIds) {
            try {
                const result = await sendPushToUser(userId, {
                    title: "Monev",
                    body: message.trim(),
                    url: targetUrl,
                    tag: "admin-broadcast",
                }, "custom");
                totalSent += result.sent;
                totalFailed += result.failed;
                totalSkipped += result.skipped || 0;
            } catch (error) {
                console.error(`[Admin Push] Failed for user ${userId}:`, error);
                totalFailed++;
            }
        }

        // Log the activity
        await db.insert(adminActivityLog).values({
            adminId: currentUserId,
            action: "send_notification",
            targetType: target,
            details: JSON.stringify({
                message,
                url: targetUrl,
                target,
                tier,
                totalRecipients: userIds.length,
                successCount: totalSent + totalSkipped,
                pushSentCount: totalSent,
                failedCount: totalFailed,
                skippedCount: totalSkipped,
            }),
        });

        return NextResponse.json({
            success: true,
            data: {
                target,
                tier,
                url: targetUrl,
                totalRecipients: userIds.length,
                subscriptionsFound: totalSent + totalFailed,
                successCount: totalSent + totalSkipped,
                pushSentCount: totalSent,
                failedCount: totalFailed,
                skippedCount: totalSkipped,
            },
        });
    } catch (error) {
        console.error("[Admin Notifications POST] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
