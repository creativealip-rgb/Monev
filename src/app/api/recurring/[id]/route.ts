import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { accounts, recurringTransactions } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);
        const { id } = await params;

        const body = await req.json();
        const db = getDb();

        // Only allow safe fields to be updated (prevent userId override)
        const safeUpdate: Record<string, unknown> = {};
        if (body.isActive !== undefined) safeUpdate.isActive = body.isActive;
        if (body.amount !== undefined) safeUpdate.amount = body.amount;
        if (body.description !== undefined) safeUpdate.description = body.description;
        if (body.categoryId !== undefined) safeUpdate.categoryId = body.categoryId;
        if (body.accountId !== undefined) {
            const accountId = Number(body.accountId);
            const account = db.select({ id: accounts.id })
                .from(accounts)
                .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
                .get();
            if (!account) return NextResponse.json({ error: "Invalid account" }, { status: 400 });
            safeUpdate.accountId = accountId;
        }
        if (body.type !== undefined) safeUpdate.type = body.type;
        if (body.frequency !== undefined) safeUpdate.frequency = body.frequency;
        if (body.nextRunAt !== undefined) safeUpdate.nextRunAt = new Date(body.nextRunAt);

        const updated = db.update(recurringTransactions)
            .set(safeUpdate)
            .where(and(eq(recurringTransactions.id, parseInt(id)), eq(recurringTransactions.userId, userId)))
            .returning().get();

        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating recurring transaction:", error);
        return NextResponse.json({ success: false, error: "Failed to update recurring transaction" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);
        const { id } = await params;

        const db = getDb();
        db.delete(recurringTransactions)
            .where(and(eq(recurringTransactions.id, parseInt(id)), eq(recurringTransactions.userId, userId)))
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting recurring transaction:", error);
        return NextResponse.json({ success: false, error: "Failed to delete recurring transaction" }, { status: 500 });
    }
}
