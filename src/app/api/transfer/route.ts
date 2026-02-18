import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { transferToGoal, transferToInvestment, payBill, getGoals, getInvestments, getBills } from "@/backend/db/operations";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await request.json();
        const { amount, destinationType, destinationId, description } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (!destinationType || !destinationId) {
            return NextResponse.json({ error: "Destination required" }, { status: 400 });
        }

        let result;
        if (destinationType === "goal") {
            result = await transferToGoal(userId, destinationId, amount, description);
        } else if (destinationType === "investment") {
            result = await transferToInvestment(userId, destinationId, amount, description);
        } else if (destinationType === "bill") {
            result = await payBill(userId, destinationId, amount, description);
        } else {
            return NextResponse.json({ error: "Invalid destination type" }, { status: 400 });
        }

        if (!result) {
            return NextResponse.json({ error: "Destination not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Error transferring:", error);
        return NextResponse.json({ success: false, error: "Transfer failed" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const [goals, investments, bills] = await Promise.all([
            getGoals(userId),
            getInvestments(userId),
            getBills(userId),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                goals: goals.map((g) => ({ id: g.id, name: g.name, currentAmount: g.currentAmount, targetAmount: g.targetAmount })),
                investments: investments.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, currentPrice: i.currentPrice })),
                bills: bills.filter((b) => !b.isPaid).map((b) => ({ id: b.id, name: b.name, amount: b.amount })),
            },
        });
    } catch (error) {
        console.error("Error fetching transfer destinations:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch destinations" }, { status: 500 });
    }
}
