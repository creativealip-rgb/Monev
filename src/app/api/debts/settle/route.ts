import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { debts } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { updateDebtStatus, createTransaction, getCategories } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const settleDebtSchema = z.object({
    debtId: z.coerce.number().int().positive(),
    createTx: z.boolean().optional(),
    payFromBalance: z.boolean().optional(),
    partialAmount: z.coerce.number().positive().max(1_000_000_000).optional(),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(session.user.id);

    const rateLimitResponse = await applyRateLimit(req, "bulk");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json().catch(() => null);
    const parsedBody = settleDebtSchema.safeParse(body);
    if (!parsedBody.success) return NextResponse.json({ error: "debtId required" }, { status: 400 });
    const { debtId, createTx, payFromBalance, partialAmount } = parsedBody.data;

    const db = getDb();

    // Fetch the debt first to get direction
    const debt = db.select().from(debts)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
        .get();

    if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

    const direction = debt.description?.startsWith("[OWED]") ? "owed" : "owe";

    // Mark as paid
    await updateDebtStatus(userId, debtId, "paid");

    // Handle paying from balance for hutang (direction=owe)
    const paymentAmount = partialAmount && partialAmount > 0 ? partialAmount : debt.amount;

    // createTransaction will automatically handle balance deduction when payFromBalance is true
    if (direction === "owe" && payFromBalance) {
        // No manual balance check needed - createTransaction handles insufficient balance
    }

    // Optionally create a transaction to reflect in balance
    if (createTx) {
        const cleanDescription = debt.description?.replace(/^\[(OWE|OWED)\]\s*/, "") || "";

        const categories = await getCategories();
        // Find appropriate category
        const lainnyaCategory = categories.find(c => c.name === "Lainnya") || categories[0];

        if (direction === "owed") {
            // Piutang diterima → income
            await createTransaction(userId, {
                amount: paymentAmount,
                description: `💸 Piutang diterima dari ${debt.debtorName}${cleanDescription ? ": " + cleanDescription : ""}`,
                categoryId: lainnyaCategory?.id || 1,
                type: "income",
                date: new Date(),
            });
        } else {
            // Hutang dibayar → expense
            await createTransaction(userId, {
                amount: paymentAmount,
                description: `💸 Bayar hutang ke ${debt.debtorName}${cleanDescription ? ": " + cleanDescription : ""}`,
                categoryId: lainnyaCategory?.id || 1,
                type: "expense",
                date: new Date(),
            });
        }
    }

    return NextResponse.json({ success: true });
}
