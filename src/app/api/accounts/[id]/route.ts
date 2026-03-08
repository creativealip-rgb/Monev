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

        const updated = await updateAccount(userId, accountId, {
            name: body.name,
            balance: body.balance,
            color: body.color,
            icon: body.icon,
            type: body.type,
            updatedAt: new Date(),
        });

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
