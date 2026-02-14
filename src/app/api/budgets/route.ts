import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBudgets, createBudget } from "@/backend/db/operations";

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

        const body = await request.json();

        const budget = await createBudget(userId, {
            categoryId: body.categoryId,
            amount: body.amount,
            month: body.month,
            year: body.year,
        });

        return NextResponse.json({ success: true, data: budget });
    } catch (error) {
        console.error("Error creating budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create budget" },
            { status: 500 }
        );
    }
}
