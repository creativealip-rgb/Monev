import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateBill, deleteBill, toggleBillPaid } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const billIdSchema = z.coerce.number().int().positive();
const billUpdateSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    amount: z.coerce.number().positive().max(1_000_000_000).optional(),
    categoryId: z.coerce.number().int().positive().nullable().optional(),
    dueDate: z.coerce.number().int().min(1).max(31).optional(),
    frequency: z.enum(["monthly", "weekly", "yearly"]).optional(),
    icon: z.string().trim().max(40).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
    action: z.literal("toggle").optional(),
    togglePaid: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "Payload kosong" });

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const parsedId = billIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }
        const id = parsedId.data;

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = billUpdateSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Payload tagihan tidak valid" }, { status: 400 });
        }

        // Check if this is a toggle paid action or full update
        if (parsedBody.data.action === "toggle" || parsedBody.data.togglePaid === true) {
            const updated = await toggleBillPaid(userId, id);
            if (!updated) return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
            return NextResponse.json({ success: true, data: updated });
        }

        const updateData = { ...parsedBody.data };
        delete updateData.action;
        delete updateData.togglePaid;
        const updated = await updateBill(userId, id, updateData);

        if (!updated) {
            return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating bill:", error);
        return NextResponse.json({ success: false, error: "Failed to update bill" }, { status: 500 });
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
        const parsedId = billIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }
        const id = parsedId.data;

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        await deleteBill(userId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting bill:", error);
        return NextResponse.json({ success: false, error: "Failed to delete bill" }, { status: 500 });
    }
}
