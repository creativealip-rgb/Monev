import { NextResponse } from "next/server";
import { updateBudget, deleteBudget } from "@/backend/db/operations";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        
        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid budget ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        
        const updated = await updateBudget(id, {
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
        const { id: idString } = await params;
        const id = parseInt(idString);
        
        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid budget ID" },
                { status: 400 }
            );
        }

        await deleteBudget(id);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting budget:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete budget" },
            { status: 500 }
        );
    }
}
