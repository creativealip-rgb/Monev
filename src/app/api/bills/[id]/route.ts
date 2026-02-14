import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateBill, deleteBill, toggleBillPaid } from "@/backend/db/operations";

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
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }

        const body = await request.json();

        // Check if this is a toggle paid action or full update
        if (body.action === "toggle") {
            const updated = await toggleBillPaid(userId, id);
            if (!updated) return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
            return NextResponse.json({ success: true, data: updated });
        }

        const updated = await updateBill(userId, id, body);

        if (!updated) {
            return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating bill:", error);
        return NextResponse.json({ success: false, error: "Failed to update bill" }, { status: 500 });
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
            return NextResponse.json({ success: false, error: "Invalid bill ID" }, { status: 400 });
        }

        await deleteBill(userId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting bill:", error);
        return NextResponse.json({ success: false, error: "Failed to delete bill" }, { status: 500 });
    }
}
