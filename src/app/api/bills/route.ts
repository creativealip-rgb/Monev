import { NextResponse } from "next/server";
import { getBills, createBill, ensureSampleBills } from "@/backend/db/operations";

export async function GET() {
    try {
        await ensureSampleBills();
        const allBills = await getBills();

        const data = allBills.map(b => ({
            id: b.id,
            name: b.name,
            amount: b.amount,
            categoryId: b.categoryId,
            dueDate: b.dueDate,
            frequency: b.frequency,
            isPaid: b.isPaid,
            lastPaidAt: b.lastPaidAt ? new Date(b.lastPaidAt).toISOString() : null,
            icon: b.icon,
            color: b.color,
            isActive: b.isActive,
            notes: b.notes,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching bills:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch bills" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const bill = await createBill(body);

        return NextResponse.json({ success: true, data: bill });
    } catch (error) {
        console.error("Error creating bill:", error);
        return NextResponse.json({ success: false, error: "Failed to create bill" }, { status: 500 });
    }
}
