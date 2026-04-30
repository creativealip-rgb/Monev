import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateAccount, deleteAccount, getAccountById } from "@/backend/db/account-operations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const accountId = parseInt(id);

        const body = await request.json();
        
        // Verify account belongs to user
        const existing = await getAccountById(userId, accountId);
        if (!existing) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (typeof body.name === "string") updates.name = body.name.trim();
        if (body.balance !== undefined) updates.balance = Number(body.balance);
        if (typeof body.color === "string") updates.color = body.color;
        if (typeof body.icon === "string") updates.icon = body.icon;
        if (typeof body.type === "string") updates.type = body.type;

        if (updates.name === "" || (updates.balance !== undefined && !Number.isFinite(updates.balance as number))) {
            return NextResponse.json({ success: false, error: "Invalid account data" }, { status: 400 });
        }

        const updated = await updateAccount(userId, accountId, updates);

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ success: false, error: "Failed to update account" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const accountId = parseInt(id);

        // Verify account belongs to user
        const existing = await getAccountById(userId, accountId);
        if (!existing) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        await deleteAccount(userId, accountId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 });
    }
}
