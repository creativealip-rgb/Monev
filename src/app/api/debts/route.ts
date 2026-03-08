import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDebt, getDebts } from "@/backend/db/operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const status = req.nextUrl.searchParams.get("status") as "paid" | "unpaid" || "unpaid";

        // Get both directions
        const [unpaid, paid] = await Promise.all([
            getDebts(userId, "unpaid"),
            getDebts(userId, "paid"),
        ]);

        const all = [...unpaid, ...paid];

        // Parse direction from description prefix: "[OWE]" means I owe, "[OWED]" means they owe me
        const parsed = all.map((d) => ({
            ...d,
            direction: d.description?.startsWith("[OWED]") ? "owed" : "owe",
            description: d.description?.replace(/^\[(OWE|OWED)\]\s*/, "") || "",
        }));

        return NextResponse.json({ success: true, data: parsed });
    } catch (error) {
        console.error("Error fetching debts:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch debts" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { debtorName, amount, description, dueDate, direction } = body;

        if (!debtorName || !amount) {
            return NextResponse.json({ error: "debtorName dan amount wajib diisi" }, { status: 400 });
        }

        // Encode direction in description prefix
        const prefix = direction === "owed" ? "[OWED] " : "[OWE] ";
        const encodedDescription = prefix + (description || "");

        const debt = await createDebt({
            userId,
            debtorName,
            amount,
            description: encodedDescription,
            dueDate: dueDate ? new Date(dueDate) : undefined,
        });

        return NextResponse.json({ success: true, data: debt });
    } catch (error) {
        console.error("Error creating debt:", error);
        return NextResponse.json({ success: false, error: "Failed to create debt" }, { status: 500 });
    }
}
