import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategories, createTransaction } from "@/backend/db/operations";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { transactions } = await req.json();

        if (!Array.isArray(transactions)) {
            return NextResponse.json({ error: "Invalid data format. Expected an array of transactions." }, { status: 400 });
        }

        const allCategories = await getCategories();
        const defaultCategory = allCategories.find(c => c.name === "Lainnya") || allCategories[0];

        const imported = [];
        const failed = [];

        for (const t of transactions) {
            try {
                // Find matching category or use default
                let categoryId = defaultCategory.id;
                if (t.category) {
                    const match = allCategories.find(c => c.name.toLowerCase() === t.category.toLowerCase());
                    if (match) categoryId = match.id;
                }

                const result = await createTransaction(userId, {
                    amount: t.amount,
                    description: t.description,
                    merchantName: t.merchantName,
                    categoryId: categoryId,
                    type: t.type || "expense",
                    date: t.date ? new Date(t.date) : new Date(),
                });
                imported.push(result);
            } catch (err) {
                console.error("Failed to import transaction:", t, err);
                failed.push(t);
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                total: transactions.length,
                imported: imported.length,
                failed: failed.length
            }
        });

    } catch (error) {
        console.error("Bulk Import API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
