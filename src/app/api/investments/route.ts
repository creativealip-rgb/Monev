import { NextResponse } from "next/server";
import { getInvestments, createInvestment, ensureSampleInvestments } from "@/backend/db/operations";

export async function GET() {
    try {
        await ensureSampleInvestments();
        const allInvestments = await getInvestments();

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
        const body = await request.json();
        const investment = await createInvestment(body);

        return NextResponse.json({ success: true, data: investment });
    } catch (error) {
        console.error("Error creating investment:", error);
        return NextResponse.json({ success: false, error: "Failed to create investment" }, { status: 500 });
    }
}
