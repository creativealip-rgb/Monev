import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    transferToGoal, transferToInvestment, payBill,
    withdrawFromGoal, withdrawFromInvestment,
    getGoals, getInvestments, getBills
} from "@/backend/db/operations";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await request.json();
        const { action, amount, type, id, description, accountId } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (!action || !type || !id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (type === "bill" && !accountId) {
            return NextResponse.json({ error: "Account ID required for bill payment" }, { status: 400 });
        }

        let result;
        const fee = amount * 0.02; // 2% admin fee

        if (action === "transfer") {
            // Transfer from main balance to goal/investment/bill
            if (type === "goal") {
                result = await transferToGoal(userId, id, amount, description);
            } else if (type === "investment") {
                result = await transferToInvestment(userId, id, amount, description);
            } else if (type === "bill") {
                result = await payBill(userId, id, { accountId, amount, notes: description });
            } else {
                return NextResponse.json({ error: "Invalid transfer type" }, { status: 400 });
            }
        } else if (action === "withdraw") {
            // Withdraw from goal/investment to main balance
            if (type === "goal") {
                result = await withdrawFromGoal(userId, id, amount, description);
            } else if (type === "investment") {
                result = await withdrawFromInvestment(userId, id, amount, description);
            } else {
                return NextResponse.json({ error: "Invalid withdraw type" }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (!result) {
            return NextResponse.json({ error: "Operation failed" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: result,
            fee,
            netAmount: amount - fee
        });
    } catch (error) {
        console.error("Error in transfer/withdraw:", error);
        const errorMessage = error instanceof Error ? error.message : "Operation failed";
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode") || "transfer"; // "transfer" or "withdraw"

        const [goals, investments, bills] = await Promise.all([
            getGoals(userId),
            getInvestments(userId),
            getBills(userId),
        ]);

        if (mode === "withdraw") {
            // For withdraw, only return goals/investments with balance/value > 0
            return NextResponse.json({
                success: true,
                data: {
                    goals: goals
                        .filter((g) => g.currentAmount > 0)
                        .map((g) => ({
                            id: g.id,
                            name: g.name,
                            currentAmount: g.currentAmount,
                            targetAmount: g.targetAmount,
                            icon: g.icon,
                            color: g.color
                        })),
                    investments: investments
                        .filter((i) => i.quantity > 0)
                        .map((i) => ({
                            id: i.id,
                            name: i.name,
                            quantity: i.quantity,
                            currentPrice: i.currentPrice,
                            avgBuyPrice: i.avgBuyPrice,
                            currentValue: i.quantity * i.currentPrice
                        })),
                },
            });
        }

        // For transfer mode (default)
        return NextResponse.json({
            success: true,
            data: {
                goals: goals.map((g) => ({
                    id: g.id,
                    name: g.name,
                    currentAmount: g.currentAmount,
                    targetAmount: g.targetAmount,
                    icon: g.icon,
                    color: g.color
                })),
                investments: investments.map((i) => ({
                    id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    currentPrice: i.currentPrice,
                    avgBuyPrice: i.avgBuyPrice
                })),
                bills: bills.filter((b) => !b.isPaid).map((b) => ({ id: b.id, name: b.name, amount: b.amount })),
            },
        });
    } catch (error) {
        console.error("Error fetching transfer destinations:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch destinations" }, { status: 500 });
    }
}
