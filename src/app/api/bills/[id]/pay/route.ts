import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { payBill } from "@/backend/db/operations";

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
        const billId = parseInt(idString);

        if (isNaN(billId)) {
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }

        const body = await request.json();
        const { accountId, amount, notes } = body;

        if (!accountId || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: "Account ID and valid amount are required" },
                { status: 400 }
            );
        }

        const result = await payBill(userId, billId, {
            accountId: parseInt(accountId),
            amount: parseFloat(amount),
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
