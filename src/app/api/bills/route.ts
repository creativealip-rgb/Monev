import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBills, createBill, ensureSampleBills } from "@/backend/db/operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        await ensureSampleBills(userId);
        const allBills = await getBills(userId);

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
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await request.json();
        const bill = await createBill(userId, body);

        return NextResponse.json({ success: true, data: bill });
    } catch (error) {
        console.error("Error creating bill:", error);
        return NextResponse.json({ success: false, error: "Failed to create bill" }, { status: 500 });
    }
}
