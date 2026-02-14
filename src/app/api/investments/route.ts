import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvestments, createInvestment, ensureSampleInvestments } from "@/backend/db/operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        await ensureSampleInvestments(userId);
        const allInvestments = await getInvestments(userId);

        // Calculate basic stats for frontend usage if needed, 
        // though better done in frontend to keep API clean.
        // We'll return raw data.

        return NextResponse.json({ success: true, data: allInvestments });
    } catch (error) {
        console.error("Error fetching investments:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch investments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await request.json();
        const investment = await createInvestment(userId, body);

        return NextResponse.json({ success: true, data: investment });
    } catch (error) {
        console.error("Error creating investment:", error);
        return NextResponse.json({ success: false, error: "Failed to create investment" }, { status: 500 });
    }
}
