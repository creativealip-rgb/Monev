import { NextResponse } from "next/server";
import { getGoals, createGoal } from "@/backend/db/operations";

// Map icon names to emojis
const iconToEmoji: Record<string, string> = {
    "Laptop": "💻",
    "Shield": "🛡️",
    "Plane": "✈️",
    "Smartphone": "📱",
    "Bike": "🏍️",
    "Target": "🎯",
    "Home": "🏠",
    "Car": "🚗",
    "GraduationCap": "🎓",
    "Heart": "❤️",
    "Gift": "🎁",
};

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
            icon: iconToEmoji[g.icon] || g.icon || "🎯",
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const goal = await createGoal({
            name: body.name,
            targetAmount: body.targetAmount,
            currentAmount: body.currentAmount || 0,
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            icon: body.icon || "Target",
            color: body.color || "#3b82f6",
        });

        return NextResponse.json({ success: true, data: goal });
    } catch (error) {
        console.error("Error creating goal:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create goal" },
            { status: 500 }
        );
    }
}
