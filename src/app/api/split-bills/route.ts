import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSplitBill, listUserSplitBills } from "@/backend/db/operations";

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

export async function POST(request: Request) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const data = await createSplitBill(userId, {
            title: body.title,
            receiptImageUrl: body.receiptImageUrl,
            paymentInstructions: body.paymentInstructions,
            items: Array.isArray(body.items) ? body.items : [],
            participants: Array.isArray(body.participants) ? body.participants : [],
        });

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        console.error("Split Bills POST Error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        }, { status: error instanceof Error ? 400 : 500 });
    }
}
