import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateDebtStatus, createTransaction, getCategories } from "@/backend/db/operations";
import { getDb } from "@/backend/db";
import { debts } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const debtIdSchema = z.coerce.number().int().positive();
const debtUpdateSchema = z.object({
    status: z.enum(["paid", "unpaid"]).optional(),
    debtorName: z.string().trim().min(1).max(120).optional(),
    amount: z.coerce.number().positive().max(1_000_000_000).optional(),
    description: z.string().trim().max(500).optional(),
    dueDate: z.string().datetime().optional().or(z.literal("")),
    direction: z.enum(["owe", "owed"]).optional(),
    payFromBalance: z.boolean().optional(),
    paymentAmount: z.coerce.number().positive().max(1_000_000_000).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "Payload kosong" });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const parsedId = debtIdSchema.safeParse(id);
        if (!parsedId.success) return NextResponse.json({ error: "Invalid debt ID" }, { status: 400 });
        const debtId = parsedId.data;

        const rateLimitResponse = await applyRateLimit(req, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await req.json().catch(() => null);
        const parsedBody = debtUpdateSchema.safeParse(body);
        if (!parsedBody.success) return NextResponse.json({ error: "Payload hutang tidak valid" }, { status: 400 });
        const { status, debtorName, amount, description, dueDate, direction, payFromBalance, paymentAmount } = parsedBody.data;

        const db = getDb();

        // If only updating status
        if (status && Object.keys(parsedBody.data).length === 1) {
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

        // Handle paying from balance for hutang (direction=owe)
        const balancePaymentAmount = paymentAmount ?? 0;
        if (payFromBalance && balancePaymentAmount > 0 && (direction || "owe") === "owe") {
            try {
                // Create expense transaction - createTransaction handles balance automatically
                const categories = await getCategories();
                const hutangCategory = categories.find(c => c.name === "Hutang") ||
                    categories.find(c => c.name === "Lainnya") ||
                    categories[0];

                await createTransaction(userId, {
                    amount: balancePaymentAmount,
                    description: `💸 Pembayaran hutang ke ${debtorName || updated.debtorName}${description ? ": " + description : ""}`,
                    categoryId: hutangCategory?.id || 1,
                    type: "expense",
                    date: new Date(),
                });
            } catch (balanceError) {
                console.error("Error processing balance payment:", balanceError);
                // Continue returning success for debt update even if balance payment fails
            }
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating debt:", error);
        return NextResponse.json({ success: false, error: "Failed to update debt" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const parsedId = debtIdSchema.safeParse(id);
        if (!parsedId.success) return NextResponse.json({ error: "Invalid debt ID" }, { status: 400 });
        const debtId = parsedId.data;

        const rateLimitResponse = await applyRateLimit(req, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const db = getDb();
        db.delete(debts)
            .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting debt:", error);
        return NextResponse.json({ success: false, error: "Failed to delete debt" }, { status: 500 });
    }
}
