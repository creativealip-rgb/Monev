import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateInvestment, deleteInvestment } from "@/backend/db/operations";

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
            return NextResponse.json({ success: false, error: "Invalid investment ID" }, { status: 400 });
        }

        const body = await request.json();
        const updated = await updateInvestment(userId, id, body);

        if (!updated) {
            return NextResponse.json({ success: false, error: "Investment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating investment:", error);
        return NextResponse.json({ success: false, error: "Failed to update investment" }, { status: 500 });
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
            return NextResponse.json({ success: false, error: "Invalid investment ID" }, { status: 400 });
        }

        await deleteInvestment(userId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting investment:", error);
        return NextResponse.json({ success: false, error: "Failed to delete investment" }, { status: 500 });
    }
}
