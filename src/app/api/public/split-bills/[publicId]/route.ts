import { NextResponse } from "next/server";
import { getPublicSplitBill, markSplitBillParticipantPaid } from "@/backend/db/operations";

export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
    try {
        const { publicId } = await params;
        const data = await getPublicSplitBill(publicId);
        if (!data) return NextResponse.json({ success: false, error: "Split bill not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Public Split Bill GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
    try {
        const { publicId } = await params;
        const body = await request.json();
        const bill = await getPublicSplitBill(publicId);
        if (!bill) return NextResponse.json({ success: false, error: "Split bill not found" }, { status: 404 });

        const data = await markSplitBillParticipantPaid(body.paymentToken, body.paymentProofUrl);
        if (!data) return NextResponse.json({ success: false, error: "Participant not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Public Split Bill payment Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
