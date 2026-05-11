import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBills, createBill } from "@/backend/db/operations";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";

const logger = createLogger("API:Bills");

const billCreateSchema = z.object({
    name: z.string().trim().min(1).max(120),
    amount: z.coerce.number().positive().max(1_000_000_000),
    categoryId: z.coerce.number().int().positive().optional().nullable(),
    dueDate: z.coerce.number().int().min(1).max(31).optional(),
    frequency: z.enum(["monthly", "weekly", "yearly"]).optional(),
    icon: z.string().trim().max(40).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    notes: z.string().trim().max(500).optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const allBills = await getBills(userId);

        const data = allBills.map(b => {
            // Handle lastPaidAt - could be Date object, string, or number (timestamp)
            let lastPaidAtValue: string | null = null;
            if (b.lastPaidAt) {
                try {
                    const date = new Date(b.lastPaidAt);
                    if (!isNaN(date.getTime())) {
                        lastPaidAtValue = date.toISOString();
                    }
                } catch {
                    lastPaidAtValue = null;
                }
            }

            return {
                id: b.id,
                name: b.name,
                amount: b.amount,
                categoryId: b.categoryId,
                dueDate: b.dueDate,
                frequency: b.frequency,
                isPaid: b.isPaid,
                lastPaidAt: lastPaidAtValue,
                icon: b.icon,
                color: b.color,
                isActive: b.isActive,
                notes: b.notes,
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        logger.error("Error fetching bills:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch bills" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = billCreateSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Payload tagihan tidak valid" }, { status: 400 });
        }

        const bill = await createBill(userId, {
            ...parsedBody.data,
            categoryId: parsedBody.data.categoryId || undefined,
        });

        return NextResponse.json({ success: true, data: bill });
    } catch (error) {
        logger.error("Error creating bill:", error);
        return NextResponse.json({ success: false, error: "Failed to create bill" }, { status: 500 });
    }
}
