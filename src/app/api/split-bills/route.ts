import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createSplitBill, listUserSplitBills } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const splitBillItemSchema = z.object({
    name: z.string().trim().min(1).max(120),
    price: z.coerce.number().positive().max(1_000_000_000),
    quantity: z.coerce.number().int().positive().max(999).optional(),
    assignedParticipantName: z.string().trim().max(120).optional(),
});

const splitBillParticipantSchema = z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(40).optional(),
    amountOwed: z.coerce.number().nonnegative().max(1_000_000_000).optional(),
});

const createSplitBillSchema = z.object({
    title: z.string().trim().min(1).max(140),
    receiptImageUrl: z.string().trim().max(2048).url().optional(),
    paymentInstructions: z.string().trim().max(500).optional(),
    items: z.array(splitBillItemSchema).min(1).max(100),
    participants: z.array(splitBillParticipantSchema).min(1).max(50),
});

function getUserId(session: Awaited<ReturnType<typeof auth>>) {
    return session?.user?.id ? parseInt(session.user.id, 10) : null;
}

export async function GET() {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const data = await listUserSplitBills(userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Split Bills GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = createSplitBillSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid split bill payload is required" }, { status: 400 });
        }

        const data = await createSplitBill(userId, parsedBody.data);

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error("Split Bills POST Error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        }, { status: error instanceof Error ? 400 : 500 });
    }
}
