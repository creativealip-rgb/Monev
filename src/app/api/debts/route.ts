import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDebt, getDebts } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const debtCreateSchema = z.object({
    debtorName: z.string().trim().min(1).max(120),
    amount: z.coerce.number().positive().max(1_000_000_000),
    description: z.string().trim().max(500).optional(),
    dueDate: z.string().datetime().optional().or(z.literal("")),
    direction: z.enum(["owe", "owed"]).optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

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

        const rateLimitResponse = await applyRateLimit(req, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await req.json().catch(() => null);
        const parsedBody = debtCreateSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ error: "debtorName dan amount wajib diisi" }, { status: 400 });
        }
        const { debtorName, amount, description, dueDate, direction } = parsedBody.data;

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
