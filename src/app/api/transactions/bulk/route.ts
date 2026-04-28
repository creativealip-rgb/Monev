import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategories, createBulkTransactions } from "@/backend/db/operations";
import type { BulkImportTransactionItem } from "@/backend/db/operations/transaction-operations";

interface BulkTransactionRequestItem extends BulkImportTransactionItem {
    category?: string;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { transactions } = await req.json() as { transactions?: BulkTransactionRequestItem[] };

        if (!Array.isArray(transactions)) {
            return NextResponse.json({ error: "Invalid data format. Expected an array of transactions." }, { status: 400 });
        }

        const allCategories = await getCategories();
        const defaultCategory = allCategories.find(c => c.name === "Lainnya") || allCategories[0];

        // Prepare transactions with category IDs
        const preparedTransactions: BulkImportTransactionItem[] = transactions.map((t) => {
            let categoryId = defaultCategory.id;
            if (t.category) {
                const match = allCategories.find((c) => c.name.toLowerCase() === t.category?.toLowerCase());
                if (match) categoryId = match.id;
            }
            return {
                ...t,
                categoryId,
                amount: parseFloat(String(t.amount)) || 0
            };
        });

        await createBulkTransactions(userId, preparedTransactions);

        return NextResponse.json({
            success: true,
            stats: {
                total: transactions.length,
                imported: transactions.length,
                failed: 0
            }
        });

    } catch (error) {
        console.error("Bulk Import API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
