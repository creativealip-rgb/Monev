import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { recurringTransactions } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);
    const { id } = await params;

    const body = await req.json();
    const db = getDb();

    const updated = db.update(recurringTransactions)
        .set(body)
        .where(and(eq(recurringTransactions.id, parseInt(id)), eq(recurringTransactions.userId, userId)))
        .returning().get();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);
    const { id } = await params;

    const db = getDb();
    db.delete(recurringTransactions)
        .where(and(eq(recurringTransactions.id, parseInt(id)), eq(recurringTransactions.userId, userId)))
        .run();

    return NextResponse.json({ success: true });
}
