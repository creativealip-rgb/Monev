import { NextResponse } from "next/server";
import { getGoals } from "@/backend/db/operations";

export async function GET() {
    try {
        const goals = await getGoals();
        
        // Map to simpler format for frontend
        const mappedGoals = goals.map(g => ({
            id: g.id,
            name: g.name,
            target: g.targetAmount,
            saved: g.currentAmount,
            percentage: Math.min((g.currentAmount / g.targetAmount) * 100, 100),
            icon: g.icon,
            color: g.color,
        }));
        
        return NextResponse.json({ success: true, data: mappedGoals });
    } catch (error) {
        console.error("Error fetching goals:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch goals" },
            { status: 500 }
        );
    }
}
