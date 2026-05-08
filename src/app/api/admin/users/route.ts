import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, adminActivityLog } from "@/backend/db/schema";
import { eq, desc, like, sql, and, or } from "drizzle-orm";

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
        const search = searchParams.get("search") || "";
        const tier = searchParams.get("tier") || "";
        const isActive = searchParams.get("isActive");

        const offset = (page - 1) * limit;

        const conditions = [];
        
        if (search) {
            const searchPattern = `%${search}%`;
            const searchCondition = or(
                like(users.name, searchPattern),
                like(users.email, searchPattern),
                like(users.username, searchPattern)
            );
            if (searchCondition) {
                conditions.push(searchCondition);
            }
        }
        
        if (tier) {
            const tierValue = tier as "starter" | "pro" | "sultan";
            conditions.push(eq(users.tier, tierValue));
        }
        
        if (isActive !== null && isActive !== "") {
            conditions.push(eq(users.isActive, isActive === "true"));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [usersList, totalCount] = await Promise.all([
            db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                username: users.username,
                image: users.image,
                tier: users.tier,
                isAdmin: users.isAdmin,
                isActive: users.isActive,
                telegramId: users.telegramId,
                whatsappId: users.whatsappId,
                tierExpiresAt: users.tierExpiresAt,
                createdAt: users.createdAt,
            })
                .from(users)
                .where(whereClause)
                .orderBy(desc(users.createdAt))
                .limit(limit)
                .offset(offset)
                .all(),
            db.select({ count: sql<number>`COUNT(*)` })
                .from(users)
                .where(whereClause)
                .get()
        ]);

        const tierStats = await db.select({
            tier: users.tier,
            count: sql<number>`COUNT(*)`,
        })
            .from(users)
            .groupBy(users.tier)
            .all();

        const tierDistribution = {
            starter: 0,
            pro: 0,
            sultan: 0,
        };
        
        tierStats.forEach((stat) => {
            tierDistribution[stat.tier as keyof typeof tierDistribution] = stat.count;
        });

        return NextResponse.json({
            success: true,
            data: {
                users: usersList,
                pagination: {
                    page,
                    limit,
                    total: totalCount?.count || 0,
                    totalPages: Math.ceil((totalCount?.count || 0) / limit),
                },
                tierDistribution,
            },
        });
    } catch (error) {
        console.error("[Admin Users] Error:", error);
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

        const body = await req.json();
        const { userId, tier, isActive } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        
        if (tier) {
            if (!["starter", "pro", "sultan"].includes(tier)) {
                return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
            }
            updateData.tier = tier as "starter" | "pro" | "sultan";
        }
        
        if (isActive !== undefined) {
            updateData.isActive = Boolean(isActive);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const updatedUser = await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                tier: users.tier,
                isActive: users.isActive,
            })
            .get();

        await db.insert(adminActivityLog).values({
            adminId: currentUserId,
            action: "update_user",
            targetType: "user",
            targetId: userId,
            details: JSON.stringify({ changes: updateData }),
        });

        return NextResponse.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error("[Admin Users PATCH] Error:", error);
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
        const userId = parseInt(searchParams.get("userId") || "");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        if (userId === currentUserId) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        const userToDelete = await db.select().from(users).where(eq(users.id, userId)).get();
        
        if (!userToDelete) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await db.delete(users).where(eq(users.id, userId));

        await db.insert(adminActivityLog).values({
            adminId: currentUserId,
            action: "delete_user",
            targetType: "user",
            targetId: userId,
            details: JSON.stringify({ deletedUser: userToDelete.email }),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin Users DELETE] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
