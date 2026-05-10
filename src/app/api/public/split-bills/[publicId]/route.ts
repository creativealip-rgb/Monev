import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicSplitBill, markSplitBillParticipantPaid } from "@/backend/db/operations";

const publicIdSchema = z.string().regex(/^split_[a-f0-9]{16}$/);
const paymentSchema = z.object({
    paymentToken: z.string().regex(/^pay_[a-f0-9]{24}$/),
    paymentProofUrl: z.string().url().max(500).optional(),
});

function invalidSplitBillResponse() {
    return NextResponse.json({ success: false, error: "Split bill not found" }, { status: 404 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
    try {
        const { publicId } = await params;
        const parsedPublicId = publicIdSchema.safeParse(publicId);
        if (!parsedPublicId.success) return invalidSplitBillResponse();

        const data = await getPublicSplitBill(parsedPublicId.data);
        if (!data) return invalidSplitBillResponse();

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Public Split Bill GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
    try {
        const { publicId } = await params;
        const parsedPublicId = publicIdSchema.safeParse(publicId);
        if (!parsedPublicId.success) return invalidSplitBillResponse();

        const body = await request.json().catch(() => null);
        const parsedBody = paymentSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Invalid payment payload" }, { status: 400 });
        }

        const data = await markSplitBillParticipantPaid(
            parsedPublicId.data,
            parsedBody.data.paymentToken,
            parsedBody.data.paymentProofUrl,
        );
        if (!data) return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Public Split Bill payment Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
