import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { debts } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { updateDebtStatus, createTransaction, getCategories } from "@/backend/db/operations";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);

    const { debtId, createTx } = await req.json();
    if (!debtId) return NextResponse.json({ error: "debtId required" }, { status: 400 });

    const db = getDb();

    // Fetch the debt first to get direction
    const debt = db.select().from(debts)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
        .get();

    if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

    // Mark as paid
    await updateDebtStatus(userId, debtId, "paid");

    // Optionally create a transaction to reflect in balance
    if (createTx) {
        const direction = debt.description?.startsWith("[OWED]") ? "owed" : "owe";
        const cleanDescription = debt.description?.replace(/^\[(OWE|OWED)\]\s*/, "") || "";

        const categories = await getCategories();
        // Find appropriate category
        const lainnyaCategory = categories.find(c => c.name === "Lainnya") || categories[0];

        if (direction === "owed") {
            // Piutang diterima → income
            await createTransaction(userId, {
                amount: debt.amount,
                description: `💸 Piutang diterima dari ${debt.debtorName}${cleanDescription ? ": " + cleanDescription : ""}`,
                categoryId: lainnyaCategory?.id || 1,
                type: "income",
                date: new Date(),
            });
        } else {
            // Hutang dibayar → expense
            await createTransaction(userId, {
                amount: debt.amount,
                description: `💸 Bayar hutang ke ${debt.debtorName}${cleanDescription ? ": " + cleanDescription : ""}`,
                categoryId: lainnyaCategory?.id || 1,
                type: "expense",
                date: new Date(),
            });
        }
    }

    return NextResponse.json({ success: true });
}
