import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateGoal, removeGoal } from "@/backend/db/operations";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const id = parseInt(idString);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid goal ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const updated = await updateGoal(userId, id, {
            name: body.name,
            targetAmount: body.targetAmount,
            currentAmount: body.currentAmount,
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            icon: body.icon,
            color: body.color,
        });

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Goal not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating goal:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update goal" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { id: idString } = await params;
        const id = parseInt(idString);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid goal ID" },
                { status: 400 }
            );
        }

        await removeGoal(userId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting goal:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete goal" },
            { status: 500 }
        );
    }
}
