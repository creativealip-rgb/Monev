import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, coupons, adminActivityLog, couponClaims } from "@/backend/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

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
        const limit = parseInt(searchParams.get("limit") || "20");
        const used = searchParams.get("used");

        const offset = (page - 1) * limit;

        let whereClause;
        if (used === "true") {
            whereClause = sql`${coupons.quota} > 0 AND ${coupons.claimedCount} >= ${coupons.quota}`;
        } else if (used === "false") {
            whereClause = sql`${coupons.claimedCount} < ${coupons.quota}`;
        }

        const [couponsList, totalCount] = await Promise.all([
            db.select({
                id: coupons.id,
                code: coupons.code,
                tier: coupons.tier,
                quota: coupons.quota,
                claimedCount: coupons.claimedCount,
                expiresAt: coupons.expiresAt,
                createdAt: coupons.createdAt,
            })
                .from(coupons)
                .where(whereClause)
                .orderBy(desc(coupons.createdAt))
                .limit(limit)
                .offset(offset)
                .all(),
            db.select({ count: sql<number>`COUNT(*)` })
                .from(coupons)
                .where(whereClause)
                .get()
        ]);

        const stats = await db.select({
            tier: coupons.tier,
            totalCoupons: sql<number>`COUNT(*)`,
            totalClaimed: sql<number>`SUM(${coupons.claimedCount})`,
            totalQuota: sql<number>`SUM(${coupons.quota})`,
        })
            .from(coupons)
            .groupBy(coupons.tier)
            .all();

        return NextResponse.json({
            success: true,
            data: {
                coupons: couponsList,
                pagination: {
                    page,
                    limit,
                    total: totalCount?.count || 0,
                    totalPages: Math.ceil((totalCount?.count || 0) / limit),
                },
                stats,
            },
        });
    } catch (error) {
        console.error("[Admin Coupons] Error:", error);
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
        const { codes, tier, expiresAt, quota } = body;

        if (!codes || codes.length === 0) {
            return NextResponse.json({ error: "At least one coupon code required" }, { status: 400 });
        }

        if (!["pro", "sultan", "benefactor"].includes(tier)) {
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        const couponQuota = quota && quota > 0 ? parseInt(quota) : 1;

        const createdCoupons = [];
        const errors = [];

        for (const code of codes) {
            const normalizedCode = code.toUpperCase().trim();
            
            const existing = await db.select().from(coupons).where(eq(coupons.code, normalizedCode)).get();
            if (existing) {
                errors.push({ code: normalizedCode, error: "Code already exists" });
                continue;
            }

            const coupon = await db.insert(coupons).values({
                code: normalizedCode,
                tier: tier as "pro" | "sultan" | "benefactor",
                quota: couponQuota,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            }).returning().get();

            createdCoupons.push(coupon);
        }

        await db.insert(adminActivityLog).values({
            adminId: currentUserId,
            action: "create_coupons",
            details: JSON.stringify({
                count: createdCoupons.length,
                tier,
                expiresAt,
                errors,
            }),
        });

        return NextResponse.json({
            success: true,
            data: {
                created: createdCoupons,
                errors,
            },
        });
    } catch (error) {
        console.error("[Admin Coupons POST] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
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
        const couponId = parseInt(searchParams.get("id") || "");

        if (!couponId) {
            return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
        }

        const coupon = await db.select().from(coupons).where(eq(coupons.id, couponId)).get();
        
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
        }

        await db.delete(coupons).where(eq(coupons.id, couponId));

        await db.insert(adminActivityLog).values({
            adminId: currentUserId,
            action: "delete_coupon",
            targetType: "coupon",
            targetId: couponId,
            details: JSON.stringify({ code: coupon.code }),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin Coupons DELETE] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
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
        const couponId = parseInt(searchParams.get("couponId") || "");
        const action = searchParams.get("action");

        if (!couponId) {
            return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
        }

        if (action === "claims") {
            const claims = await db.select({
                id: couponClaims.id,
                couponId: couponClaims.couponId,
                userId: couponClaims.userId,
                claimedAt: couponClaims.claimedAt,
            })
                .from(couponClaims)
                .where(eq(couponClaims.couponId, couponId))
                .all();

            const userIds = [...new Set(claims.map(c => c.userId))];
            const usersData = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
                .from(users)
                .where(inArray(users.id, userIds))
                .all();

            const userMap = Object.fromEntries(usersData.map(u => [u.id, u]));

            const enrichedClaims = claims.map(claim => ({
                ...claim,
                user: userMap[claim.userId] || null,
            }));

            return NextResponse.json({ success: true, data: enrichedClaims });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("[Admin Coupons PATCH] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
