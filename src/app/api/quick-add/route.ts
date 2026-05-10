import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createQuickAddShortcut, getQuickAddShortcuts, getQuickAddSuggestions } from "@/backend/db/operations";

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

        const body = await request.json();
        const amount = Number(body.amount);
        const categoryId = Number(body.categoryId);
        const accountId = Number(body.accountId);

        if (!body.label || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(categoryId) || !Number.isInteger(accountId)) {
            return NextResponse.json({ success: false, error: "Valid label, amount, category, and account are required" }, { status: 400 });
        }

        const data = await createQuickAddShortcut(userId, {
            label: body.label,
            amount,
            type: body.type === "income" ? "income" : "expense",
            categoryId,
            accountId,
            merchantName: body.merchantName,
            paymentMethod: body.paymentMethod,
            icon: body.icon,
            color: body.color,
            sortOrder: body.sortOrder,
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Quick Add POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
