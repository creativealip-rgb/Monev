import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { adminActivityLog, adminScheduledNotifications, users } from "@/backend/db/schema";
import { and, eq } from "drizzle-orm";
import { sendPushToUser } from "@/lib/send-push";

function getJakartaParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(date).reduce<Record<string, string>>((acc, part) => {
        if (part.type !== "literal") acc[part.type] = part.value;
        return acc;
    }, {});
    return {
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        runKey: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`,
    };
}

export async function GET(req: Request) {
    const expectedSecret = process.env.CRON_SECRET;
    const providedSecret = new URL(req.url).searchParams.get("secret") || req.headers.get("x-cron-secret");
    if (expectedSecret && providedSecret !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const now = new Date();
    const { hour, minute, runKey } = getJakartaParts(now);
    const schedules = await db.select().from(adminScheduledNotifications).where(and(
        eq(adminScheduledNotifications.isActive, true),
        eq(adminScheduledNotifications.hour, hour),
        eq(adminScheduledNotifications.minute, minute),
    )).all();

    const results = [];
    for (const schedule of schedules) {
        if (schedule.lastRunKey === runKey) continue;
        const targetUsers = schedule.target === "tier" && schedule.tier
            ? await db.select({ id: users.id }).from(users).where(and(eq(users.isActive, true), eq(users.tier, schedule.tier))).all()
            : await db.select({ id: users.id }).from(users).where(eq(users.isActive, true)).all();

        let sent = 0;
        let failed = 0;
        for (const user of targetUsers) {
            try {
                const result = await sendPushToUser(user.id, {
                    title: schedule.title,
                    body: schedule.message,
                    url: "/dashboard",
                    tag: `admin-schedule-${schedule.id}`,
                }, "custom");
                sent += result.sent;
                failed += result.failed;
            } catch (error) {
                console.error(`[Admin Schedule] Failed user ${user.id}:`, error);
                failed++;
            }
        }

        await db.update(adminScheduledNotifications).set({ lastRunAt: now, lastRunKey: runKey, updatedAt: now }).where(eq(adminScheduledNotifications.id, schedule.id));
        await db.insert(adminActivityLog).values({
            adminId: schedule.createdBy || 0,
            action: "send_notification",
            targetType: "scheduled_notification",
            targetId: schedule.id,
            details: JSON.stringify({
                message: schedule.message,
                target: schedule.target,
                tier: schedule.tier,
                totalRecipients: targetUsers.length,
                successCount: sent,
                failedCount: failed,
                scheduleId: schedule.id,
                runKey,
            }),
        });
        results.push({ id: schedule.id, recipients: targetUsers.length, sent, failed });
    }

    return NextResponse.json({ success: true, runKey, checked: schedules.length, results });
}
