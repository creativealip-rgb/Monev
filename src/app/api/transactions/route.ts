import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTransactions, createTransaction } from "@/backend/db/operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const transactions = await getTransactions(userId, 50);
        return NextResponse.json({ success: true, data: transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await request.json();

        const transaction = await createTransaction(userId, {
            amount: body.amount,
            description: body.description,
            merchantName: body.merchantName,
            categoryId: body.categoryId,
            type: body.type,
            paymentMethod: body.paymentMethod || "cash",
            date: new Date(body.date || Date.now()),
        });

        return NextResponse.json({ success: true, data: transaction });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
