import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getBudgets, createBudget } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const budgetSchema = z.object({
    categoryId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive().max(1_000_000_000),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    enableRollover: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        const budgets = await getBudgets(userId, month, year);

        // Map to simpler format for frontend
        const mappedBudgets = budgets.map(b => ({
            id: b.id,
            category: b.category.name,
            categoryId: b.categoryId,
            limit: b.amount,
            spent: b.spent,
            color: b.category.color,
            percentage: Math.min((b.spent / b.amount) * 100, 100),
            enableRollover: b.enableRollover,
        }));

        return NextResponse.json({ success: true, data: mappedBudgets });
    } catch (error) {
        console.error("Error fetching budgets:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch budgets" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = budgetSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid budget payload is required" }, { status: 400 });
        }

        const budget = await createBudget(userId, parsedBody.data);

        return NextResponse.json({ success: true, data: budget });
    } catch (error) {
        console.error("Error creating budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create budget" },
            { status: 500 }
        );
    }
}
