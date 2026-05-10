import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createRecurringTransaction, upsertRecurringSuggestionState } from "@/backend/db/operations";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const amount = Number(body.amount);
        const categoryId = body.categoryId ? Number(body.categoryId) : null;
        const nextRunAt = body.nextRunAt ? new Date(body.nextRunAt) : new Date();
        const frequency = body.frequency === "weekly" || body.frequency === "daily" ? body.frequency : "monthly";
        const type = body.type === "income" ? "income" : "expense";

        if (!body.description || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(nextRunAt.getTime())) {
            return NextResponse.json({ success: false, error: "Valid description, amount, and nextRunAt are required" }, { status: 400 });
        }

        const userId = parseInt(session.user.id, 10);
        const data = await createRecurringTransaction(userId, {
            amount,
            description: body.description,
            categoryId,
            type,
            frequency,
            nextRunAt,
        });

        if (body.patternKey) {
            await upsertRecurringSuggestionState(userId, String(body.patternKey), "accepted");
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Create recurring from pattern error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
