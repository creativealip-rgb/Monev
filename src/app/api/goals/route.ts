import { NextResponse } from "next/server";
import { auth } from "@/auth";
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
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const goals = await getGoals(userId);

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
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await request.json();

        const goal = await createGoal(userId, {
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
