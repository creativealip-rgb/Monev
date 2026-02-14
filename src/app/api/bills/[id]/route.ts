import { NextResponse } from "next/server";
import { updateBill, deleteBill, toggleBillPaid, getBillById } from "@/backend/db/operations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        let bill;
        if (body.togglePaid) {
            bill = await toggleBillPaid(Number(id));
        } else {
            bill = await updateBill(Number(id), body);
        }

        if (!bill) {
            return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: bill });
    } catch (error) {
        console.error("Error updating bill:", error);
        return NextResponse.json({ success: false, error: "Failed to update bill" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await deleteBill(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting bill:", error);
        return NextResponse.json({ success: false, error: "Failed to delete bill" }, { status: 500 });
    }
}
