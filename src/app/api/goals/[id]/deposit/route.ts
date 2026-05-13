import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { transferToGoal } from "@/backend/db/operations";

const depositSchema = z.object({
    amount: z.coerce.number().positive().max(1_000_000_000),
    accountId: z.coerce.number().int().positive().optional(),
    description: z.string().trim().max(300).optional(),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id: idString } = await params;
        const goalId = Number(idString);
        if (!Number.isInteger(goalId) || goalId <= 0) {
            return NextResponse.json({ success: false, error: "Invalid goal ID" }, { status: 400 });
        }

        const body = await request.json().catch(() => null);
        const parsedBody = depositSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid deposit payload is required" }, { status: 400 });
        }

        const userId = Number(session.user.id);
        const transaction = await transferToGoal(
            userId,
            goalId,
            parsedBody.data.amount,
            parsedBody.data.description,
            parsedBody.data.accountId,
        );

        if (!transaction) {
            return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: transaction });
    } catch (error) {
        console.error("Error depositing to goal:", error);
        return NextResponse.json({ success: false, error: "Failed to deposit to goal" }, { status: 500 });
    }
}
