import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { adminActivityLog, mayarPayments, users } from "@/backend/db/schema";
import { and, desc, eq, like, or, sql } from "drizzle-orm";

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };

    const adminId = Number(session.user.id);
    const db = getDb();
    const admin = await db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, adminId))
        .get();

    if (!admin?.isAdmin) return { error: "Forbidden", status: 403 as const };
    return { adminId, db };
}

function toBool(value: string | null) {
    if (value === null || value === "") return undefined;
    return value === "true" || value === "1";
}

function addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

export async function GET(req: NextRequest) {
    try {
        const guard = await requireAdmin();
        if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") || 1));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
        const search = searchParams.get("search")?.trim();
        const unmatched = toBool(searchParams.get("unmatched"));
        const offset = (page - 1) * limit;

        const conditions = [];
        if (search) {
            const pattern = `%${search}%`;
            conditions.push(or(
                like(mayarPayments.transactionId, pattern),
                like(mayarPayments.customerEmail, pattern),
                like(mayarPayments.customerName, pattern),
                like(mayarPayments.productName, pattern)
            ));
        }
        if (unmatched !== undefined) {
            conditions.push(unmatched ? sql`${mayarPayments.userId} IS NULL` : sql`${mayarPayments.userId} IS NOT NULL`);
        }

        const whereClause = conditions.length ? and(...conditions) : undefined;
        const rows = await guard.db
            .select({
                id: mayarPayments.id,
                transactionId: mayarPayments.transactionId,
                userId: mayarPayments.userId,
                customerEmail: mayarPayments.customerEmail,
                customerName: mayarPayments.customerName,
                productName: mayarPayments.productName,
                amount: mayarPayments.amount,
                status: mayarPayments.status,
                tier: mayarPayments.tier,
                isBenefector: mayarPayments.isBenefector,
                createdAt: mayarPayments.createdAt,
                userEmail: users.email,
                userName: users.name,
            })
            .from(mayarPayments)
            .leftJoin(users, eq(mayarPayments.userId, users.id))
            .where(whereClause)
            .orderBy(desc(mayarPayments.createdAt))
            .limit(limit)
            .offset(offset)
            .all();

        const total = await guard.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(mayarPayments)
            .where(whereClause)
            .get();

        return NextResponse.json({
            success: true,
            data: {
                payments: rows,
                pagination: { page, limit, total: total?.count || 0, totalPages: Math.ceil((total?.count || 0) / limit) },
            },
        });
    } catch (error) {
        console.error("[Admin Mayar Payments] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAdmin();
        if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

        const body = await req.json().catch(() => ({}));
        const paymentId = Number(body.paymentId);
        const userId = Number(body.userId);
        if (!Number.isFinite(paymentId) || !Number.isFinite(userId)) {
            return NextResponse.json({ error: "paymentId and userId are required" }, { status: 400 });
        }

        const payment = await guard.db.select().from(mayarPayments).where(eq(mayarPayments.id, paymentId)).get();
        if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

        const user = await guard.db.select().from(users).where(eq(users.id, userId)).get();
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const updateUser: Partial<typeof users.$inferInsert> = {};
        if (payment.isBenefector) updateUser.isBenefector = true;
        if (payment.tier) {
            updateUser.tier = payment.tier;
            updateUser.tierExpiresAt = addMonths(new Date(), 1);
        }
        if (Object.keys(updateUser).length === 0) {
            return NextResponse.json({ error: "Payment has no tier/benefector activation" }, { status: 400 });
        }

        await guard.db.update(users).set(updateUser).where(eq(users.id, userId));
        const updatedPayment = await guard.db
            .update(mayarPayments)
            .set({ userId, status: "manually_matched" })
            .where(eq(mayarPayments.id, paymentId))
            .returning()
            .get();

        await guard.db.insert(adminActivityLog).values({
            adminId: guard.adminId,
            action: "match_mayar_payment",
            targetType: "mayar_payment",
            targetId: paymentId,
            details: JSON.stringify({ userId, transactionId: payment.transactionId, updateUser }),
        });

        return NextResponse.json({ success: true, data: { payment: updatedPayment, user: { id: user.id, email: user.email, ...updateUser } } });
    } catch (error) {
        console.error("[Admin Mayar Payments POST] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
