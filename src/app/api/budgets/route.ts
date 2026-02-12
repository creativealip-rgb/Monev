import { NextResponse } from "next/server";
import { getBudgets } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        
        const budgets = await getBudgets(month, year);
        
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
