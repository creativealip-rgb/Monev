import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateDebtStatus } from "@/backend/db/operations";
import { getDb } from "@/backend/db";
import { debts } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);
    const { id } = await params;
    const debtId = parseInt(id);

    const body = await req.json();
    const { status, debtorName, amount, description, dueDate, direction } = body;

    const db = getDb();

    // If only updating status
    if (status && Object.keys(body).length === 1) {
        const updated = await updateDebtStatus(userId, debtId, status);
        if (!updated) return NextResponse.json({ error: "Debt not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
    }

    // Full update
    const updateData: Partial<typeof debts.$inferInsert> = {};
    if (status) updateData.status = status;
    if (debtorName) updateData.debtorName = debtorName;
    if (amount) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (description !== undefined || direction !== undefined) {
        const prefix = (direction || "owe") === "owed" ? "[OWED] " : "[OWE] ";
        updateData.description = prefix + (description || "");
    }

    const updated = db.update(debts)
        .set(updateData)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
        .returning()
        .get();

    if (!updated) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);
    const { id } = await params;
    const debtId = parseInt(id);

    const db = getDb();
    db.delete(debts)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
        .run();

    return NextResponse.json({ success: true });
}
