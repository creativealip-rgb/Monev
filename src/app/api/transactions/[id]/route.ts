import { NextResponse } from "next/server";
import { deleteTransaction, updateTransaction } from "@/backend/db/operations";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        
        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid transaction ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        
        const updated = await updateTransaction(id, {
            amount: body.amount,
            description: body.description,
            merchantName: body.merchantName,
            categoryId: body.categoryId,
            type: body.type,
            paymentMethod: body.paymentMethod,
            date: body.date ? new Date(body.date) : undefined,
        });
        
        if (!updated) {
            return NextResponse.json(
                { success: false, error: "Transaction not found" },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update transaction" },
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
                { success: false, error: "Invalid transaction ID" },
                { status: 400 }
            );
        }

        await deleteTransaction(id);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete transaction" },
            { status: 500 }
        );
    }
}
