import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvestmentsSummary, createInvestment } from "@/backend/db/operations/investment-operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const summary = await getInvestmentsSummary(userId);
        return NextResponse.json({ success: true, data: summary });
    } catch (error) {
        console.error("GET /api/investments error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const body = await request.json();

        const { name, type, quantity, avgBuyPrice, currentPrice, platform, icon, color, notes } = body;

        if (!name || !type || quantity == null || avgBuyPrice == null || currentPrice == null) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const investment = await createInvestment(userId, {
            name,
            type,
            quantity: Number(quantity),
            avgBuyPrice: Number(avgBuyPrice),
            currentPrice: Number(currentPrice),
            platform,
            icon,
            color,
            notes,
        });

        return NextResponse.json({ success: true, data: investment });
    } catch (error) {
        console.error("POST /api/investments error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
