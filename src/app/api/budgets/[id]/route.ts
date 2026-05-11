import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { updateBudget, deleteBudget } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const budgetIdSchema = z.coerce.number().int().positive();
const updateBudgetSchema = z.object({
    amount: z.coerce.number().positive().max(1_000_000_000),
});

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const parsedId = budgetIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json(
                { success: false, error: "Invalid budget ID" },
                { status: 400 }
            );
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = updateBudgetSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid budget amount is required" }, { status: 400 });
        }

        const updated = await updateBudget(userId, parsedId.data, parsedBody.data);

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Budget not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update budget" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const parsedId = budgetIdSchema.safeParse(idString);
        if (!parsedId.success) {
            return NextResponse.json(
                { success: false, error: "Invalid budget ID" },
                { status: 400 }
            );
        }

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        await deleteBudget(userId, parsedId.data);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete budget" },
            { status: 500 }
        );
    }
}
