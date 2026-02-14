import { NextResponse } from "next/server";
import { updateInvestment, deleteInvestment, getInvestmentById } from "@/backend/db/operations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        // If body has price update logic, handle it.
        // For now, general update.
        const investment = await updateInvestment(Number(id), body);

        if (!investment) {
            return NextResponse.json({ success: false, error: "Investment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: investment });
    } catch (error) {
        console.error("Error updating investment:", error);
        return NextResponse.json({ success: false, error: "Failed to update investment" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteInvestment(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting investment:", error);
        return NextResponse.json({ success: false, error: "Failed to delete investment" }, { status: 500 });
    }
}
