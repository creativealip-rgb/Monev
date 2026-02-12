import { NextResponse } from "next/server";
import { getTransactions, createTransaction } from "@/backend/db/operations";

export async function GET() {
    try {
        const transactions = await getTransactions(50);
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
        const body = await request.json();
        
        const transaction = await createTransaction({
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
