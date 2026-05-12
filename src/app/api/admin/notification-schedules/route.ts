import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { adminActivityLog, adminScheduledNotifications, users } from "@/backend/db/schema";
import { desc, eq } from "drizzle-orm";

const TIERS = ["starter", "pro", "sultan", "benefactor"] as const;

type Tier = typeof TIERS[number];

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };

    const db = getDb();
    const adminId = parseInt(session.user.id, 10);
    const admin = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, adminId)).get();
    if (!admin?.isAdmin) return { error: "Forbidden", status: 403 as const };

    return { db, adminId };
}

export async function GET() {
    const guard = await requireAdmin();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const schedules = await guard.db.select().from(adminScheduledNotifications).orderBy(desc(adminScheduledNotifications.createdAt)).all();
    return NextResponse.json({ success: true, data: { schedules } });
}

export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const body = await req.json();
    const name = String(body.name || "Reminder").trim() || "Reminder";
    const message = String(body.message || "").trim();
    const title = String(body.title || "Monev").trim() || "Monev";
    const target = body.target === "tier" ? "tier" : "all";
    const tier = target === "tier" ? String(body.tier || "") : null;
    const hour = Number(body.hour);
    const minute = Number(body.minute ?? 0);

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });
    if (message.length > 500) return NextResponse.json({ error: "Message too long (max 500 chars)" }, { status: 400 });
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return NextResponse.json({ error: "Invalid hour" }, { status: 400 });
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return NextResponse.json({ error: "Invalid minute" }, { status: 400 });
    if (target === "tier" && !TIERS.includes(tier as Tier)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    const [schedule] = await guard.db.insert(adminScheduledNotifications).values({
        name,
        title,
        message,
        target,
        tier: tier as Tier | null,
        hour,
        minute,
        timezone: "Asia/Jakarta",
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        createdBy: guard.adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();

    await guard.db.insert(adminActivityLog).values({
        adminId: guard.adminId,
        action: "create_notification_schedule",
        targetType: target,
        details: JSON.stringify({ scheduleId: schedule.id, name, message, target, tier, hour, minute }),
    });

    return NextResponse.json({ success: true, data: schedule });
}

export async function PATCH(req: NextRequest) {
    const guard = await requireAdmin();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid schedule id" }, { status: 400 });

    const updates: Partial<typeof adminScheduledNotifications.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.name === "string") updates.name = body.name.trim() || "Reminder";
    if (typeof body.message === "string") updates.message = body.message.trim();
    if (typeof body.title === "string") updates.title = body.title.trim() || "Monev";
    if (body.target === "all" || body.target === "tier") updates.target = body.target;
    if (body.target === "all") updates.tier = null;
    if (body.target === "tier" && TIERS.includes(body.tier as Tier)) updates.tier = body.tier;
    if (Number.isInteger(Number(body.hour))) updates.hour = Number(body.hour);
    if (Number.isInteger(Number(body.minute))) updates.minute = Number(body.minute);

    await guard.db.update(adminScheduledNotifications).set(updates).where(eq(adminScheduledNotifications.id, id));
    await guard.db.insert(adminActivityLog).values({
        adminId: guard.adminId,
        action: "update_notification_schedule",
        targetType: "notification_schedule",
        targetId: id,
        details: JSON.stringify(updates),
    });

    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
    const guard = await requireAdmin();
    if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid schedule id" }, { status: 400 });

    await guard.db.delete(adminScheduledNotifications).where(eq(adminScheduledNotifications.id, id));
    await guard.db.insert(adminActivityLog).values({
        adminId: guard.adminId,
        action: "delete_notification_schedule",
        targetType: "notification_schedule",
        targetId: id,
        details: JSON.stringify({ scheduleId: id }),
    });

    return NextResponse.json({ success: true });
}
