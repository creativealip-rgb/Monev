import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateBudget, deleteBudget } from "@/backend/db/operations";

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
                { success: false, error: "Invalid budget ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const updated = await updateBudget(userId, id, {
            amount: body.amount,
        });

        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Budget not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update budget" },
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
                { success: false, error: "Invalid budget ID" },
                { status: 400 }
            );
        }

        await deleteBudget(userId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete budget" },
            { status: 500 }
        );
    }
}
