import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { deleteTransaction, updateTransaction } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const transactionIdSchema = z.coerce.number().int().positive();
const updateTransactionSchema = z.object({
    amount: z.coerce.number().positive().max(1_000_000_000).optional(),
    description: z.string().trim().max(300).optional(),
    merchantName: z.string().trim().max(120).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    type: z.enum(["expense", "income", "transfer"]).optional(),
    paymentMethod: z.string().trim().max(40).optional(),
    accountId: z.coerce.number().int().positive().optional(),
    targetAccountId: z.coerce.number().int().positive().nullable().optional(),
    date: z.coerce.date().optional(),
}).refine((payload) => Object.keys(payload).length > 0, "At least one field is required");

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const parsedId = transactionIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json(
                { success: false, error: "Invalid transaction ID" },
                { status: 400 }
            );
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = updateTransactionSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid transaction update payload is required" }, { status: 400 });
        }

        const updated = await updateTransaction(userId, parsedId.data, parsedBody.data);

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Transaction not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update transaction" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const parsedId = transactionIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json(
                { success: false, error: "Invalid transaction ID" },
                { status: 400 }
            );
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        await deleteTransaction(userId, parsedId.data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete transaction" },
            { status: 500 }
        );
    }
}
