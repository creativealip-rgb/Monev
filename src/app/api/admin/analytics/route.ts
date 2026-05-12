import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, transactions, adminActivityLog } from "@/backend/db/schema";
import { eq, sql, desc, gte, lte, and, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
    // Build-time bypass for static export
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production') {
        try {
            // Check if we are actually in a real request or just pre-rendering
            // For static export, we want to skip the logic
            if (req.headers.get('x-next-build')) return NextResponse.json({ static: true });
        } catch (e) {
            return NextResponse.json({ static: true });
        }
    }

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
        const period = searchParams.get("period") || "30";

        const now = new Date();
        const startDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersLast7Days,
            newUsersLast30Days,
            activeUsersLast7Days,
            tierStats,
            userGrowth,
            recentActivity,
        ] = await Promise.all([
            db.select({ count: sql<number>`COUNT(*)` }).from(users).get(),
            db.select({ count: sql<number>`COUNT(*)` })
                .from(users)
                .where(gte(users.createdAt, sevenDaysAgo))
                .get(),
            db.select({ count: sql<number>`COUNT(*)` })
                .from(users)
                .where(gte(users.createdAt, thirtyDaysAgo))
                .get(),
            db.select({ count: sql<number>`COUNT(DISTINCT user_id)` })
                .from(transactions)
                .where(gte(transactions.date, sevenDaysAgo))
                .get(),
            db.select({
                tier: users.tier,
                count: sql<number>`COUNT(*)`,
            })
                .from(users)
                .groupBy(users.tier)
                .all(),
            db.select({
                month: sql<string>`strftime('%Y-%m', created_at)`,
                count: sql<number>`COUNT(*)`,
            })
                .from(users)
                .where(gte(users.createdAt, new Date(now.getFullYear(), now.getMonth() - 12, 1)))
                .groupBy(sql`strftime('%Y-%m', created_at)`)
                .orderBy(sql`strftime('%Y-%m', created_at)`)
                .all(),
            db.select({
                id: adminActivityLog.id,
                action: adminActivityLog.action,
                targetType: adminActivityLog.targetType,
                adminId: adminActivityLog.adminId,
                details: adminActivityLog.details,
                createdAt: adminActivityLog.createdAt,
            })
                .from(adminActivityLog)
                .orderBy(desc(adminActivityLog.createdAt))
                .limit(10)
                .all(),
        ]);

        const tierDistribution = {
            starter: 0,
            pro: 0,
            sultan: 0,
            benefactor: 0,
        };

        tierStats.forEach((stat) => {
            if (stat.tier in tierDistribution) {
                tierDistribution[stat.tier as keyof typeof tierDistribution] = stat.count;
            }
        });

        const estimatedRevenue = (tierDistribution.pro * 29000) + (tierDistribution.sultan * 49000) + (tierDistribution.benefactor * 199000);

        const dailyStats = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

            const dayStats = await db.select({
                count: sql<number>`COUNT(*)`,
            })
                .from(users)
                .where(and(
                    gte(users.createdAt, dayStart),
                    lte(users.createdAt, dayEnd)
                ))
                .get();

            dailyStats.push({
                date: dayStart.toISOString().split("T")[0],
                count: dayStats?.count || 0,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                totalUsers: totalUsers?.count || 0,
                newUsersLast7Days: newUsersLast7Days?.count || 0,
                newUsersLast30Days: newUsersLast30Days?.count || 0,
                activeUsersLast7Days: activeUsersLast7Days?.count || 0,
                tierDistribution,
                estimatedRevenue,
                userGrowth,
                dailyStats,
                recentActivity,
            },
        });
    } catch (error) {
        console.error("[Admin Analytics] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
