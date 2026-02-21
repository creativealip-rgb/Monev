import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, adminActivityLog } from "@/backend/db/schema";
import { eq, desc, sql } from "drizzle-orm";

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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const action = searchParams.get("action");

        const offset = (page - 1) * limit;

        let whereClause;
        if (action) {
            whereClause = eq(adminActivityLog.action, action);
        }

        const [activities, totalCount] = await Promise.all([
            db.select({
                id: adminActivityLog.id,
                adminId: adminActivityLog.adminId,
                action: adminActivityLog.action,
                targetType: adminActivityLog.targetType,
                targetId: adminActivityLog.targetId,
                details: adminActivityLog.details,
                createdAt: adminActivityLog.createdAt,
            })
                .from(adminActivityLog)
                .where(whereClause)
                .orderBy(desc(adminActivityLog.createdAt))
                .limit(limit)
                .offset(offset)
                .all(),
            db.select({ count: sql<number>`COUNT(*)` })
                .from(adminActivityLog)
                .where(whereClause)
                .get()
        ]);

        const adminIds = [...new Set(activities.map(a => a.adminId))];
        const admins = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
            .from(users)
            .where(sql`${users.id} IN (${adminIds.join(',')})`)
            .all();

        const adminMap = Object.fromEntries(admins.map(a => [a.id, a]));

        const enrichedActivities = activities.map(activity => ({
            ...activity,
            admin: adminMap[activity.adminId] || null,
        }));

        return NextResponse.json({
            success: true,
            data: {
                activities: enrichedActivities,
                pagination: {
                    page,
                    limit,
                    total: totalCount?.count || 0,
                    totalPages: Math.ceil((totalCount?.count || 0) / limit),
                },
            },
        });
    } catch (error) {
        console.error("[Admin Activity] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
