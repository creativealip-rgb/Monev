import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTransactions, getTransactionsCount, createTransaction } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const search = searchParams.get("search") || undefined;

        // Get transactions with pagination
        const transactions = await getTransactions(userId, limit, offset, search);

        // Get total count for pagination
        const total = await getTransactionsCount(userId, search);

        return NextResponse.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + transactions.length < total
            }
        });
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
            accountId: body.accountId,
            targetAccountId: body.targetAccountId,
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
