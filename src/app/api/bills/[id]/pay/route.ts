import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { payBill } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const billIdSchema = z.coerce.number().int().positive();
const billPaymentSchema = z.object({
    accountId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive().max(1_000_000_000),
    notes: z.string().trim().max(500).optional(),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const parsedId = billIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }
        const billId = parsedId.data;

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = billPaymentSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json(
                { success: false, error: "Account ID and valid amount are required" },
                { status: 400 }
            );
        }
        const { accountId, amount, notes } = parsedBody.data;

        const result = await payBill(userId, billId, {
            accountId,
            amount,
            notes: notes || "",
        });

        console.log("[API payBill] Result:", result);

        if (!result) {
            return NextResponse.json(
                { success: false, error: "Failed to process payment. Insufficient balance or bill not found." },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Error paying bill:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process payment" },
            { status: 500 }
        );
    }
}
