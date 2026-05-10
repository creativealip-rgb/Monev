import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createQuickAddShortcut, getQuickAddShortcuts, getQuickAddSuggestions } from "@/backend/db/operations";
import { applyRateLimit } from "@/lib/api-rate-limit";

const quickAddSchema = z.object({
    label: z.string().trim().min(1).max(80),
    amount: z.coerce.number().positive().max(1_000_000_000),
    type: z.enum(["expense", "income"]).default("expense"),
    categoryId: z.coerce.number().int().positive(),
    accountId: z.coerce.number().int().positive(),
    merchantName: z.string().trim().max(120).optional(),
    paymentMethod: z.string().trim().max(40).optional(),
    icon: z.string().trim().max(40).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

function getUserId(session: Awaited<ReturnType<typeof auth>>) {
    return session?.user?.id ? parseInt(session.user.id, 10) : null;
}

export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        if (request.nextUrl.searchParams.get("suggestions") === "true") {
            const data = await getQuickAddSuggestions(userId);
            return NextResponse.json({ success: true, data });
        }

        const data = await getQuickAddShortcuts(userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Quick Add GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = quickAddSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid quick add payload is required" }, { status: 400 });
        }

        const data = await createQuickAddShortcut(userId, parsedBody.data);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Quick Add POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
