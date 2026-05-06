import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateAccount, deleteAccount, getAccountById, createBalanceAuditEntry } from "@/backend/db/account-operations";
import type { Account } from "@/backend/db/schema";

const ACCOUNT_TYPES = new Set(["bank", "emoney", "cash", "credit_card", "investment_wallet"]);

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

        const updates: Partial<Account> = { updatedAt: new Date() };
        if (typeof body.name === "string") {
            const name = body.name.trim();
            if (!name) return NextResponse.json({ success: false, error: "Nama akun wajib diisi" }, { status: 400 });
            updates.name = name;
        }
        if (body.balance !== undefined) {
            const balance = Number(body.balance);
            if (!Number.isFinite(balance) || balance < 0) {
                return NextResponse.json({ success: false, error: "Saldo akun tidak valid" }, { status: 400 });
            }
            updates.balance = balance;
        }
        if (typeof body.color === "string" && body.color.trim()) updates.color = body.color;
        if (typeof body.icon === "string" && body.icon.trim()) updates.icon = body.icon;
        if (typeof body.type === "string") {
            if (!ACCOUNT_TYPES.has(body.type)) {
                return NextResponse.json({ success: false, error: "Tipe akun tidak valid" }, { status: 400 });
            }
            updates.type = body.type;
        }

        const previousBalance = Number(existing.balance || 0);
        const updated = await updateAccount(userId, accountId, updates);

        if (updates.balance !== undefined && updated) {
            const nextBalance = Number(updated.balance || 0);
            const delta = nextBalance - previousBalance;
            if (delta !== 0) {
                await createBalanceAuditEntry(userId, {
                    accountId,
                    accountName: updated.name,
                    amount: delta,
                    kind: "balance_adjustment",
                    previousBalance,
                    nextBalance,
                });
            }
        }

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
