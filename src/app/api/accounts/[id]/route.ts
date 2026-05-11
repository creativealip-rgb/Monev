import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { updateAccount, deleteAccount, getAccountById, createBalanceAuditEntry } from "@/backend/db/account-operations";
import type { Account } from "@/backend/db/schema";
import { applyRateLimit } from "@/lib/api-rate-limit";

const accountIdSchema = z.coerce.number().int().positive();
const updateAccountSchema = z.object({
    name: z.string().trim().min(1).max(80).optional(),
    balance: z.coerce.number().nonnegative().max(1_000_000_000).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    icon: z.string().trim().min(1).max(40).optional(),
    type: z.enum(["bank", "emoney", "cash", "credit_card", "investment_wallet"]).optional(),
}).refine((payload) => Object.keys(payload).length > 0, "At least one field is required");

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const parsedId = accountIdSchema.safeParse(id);
        if (!parsedId.success) {
            return NextResponse.json({ success: false, error: "Invalid account ID" }, { status: 400 });
        }
        const accountId = parsedId.data;

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = updateAccountSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid account update payload is required" }, { status: 400 });
        }
        
        // Verify account belongs to user
        const existing = await getAccountById(userId, accountId);
        if (!existing) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const updates: Partial<Account> = { ...parsedBody.data, updatedAt: new Date() };
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
        const parsedId = accountIdSchema.safeParse(id);
        if (!parsedId.success) {
            return NextResponse.json({ success: false, error: "Invalid account ID" }, { status: 400 });
        }
        const accountId = parsedId.data;

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

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
