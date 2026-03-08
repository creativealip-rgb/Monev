import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { recurringTransactions } from "@/backend/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { createTransaction, getCategories } from "@/backend/db/operations";

// GET - list all recurring transactions for user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const db = getDb();
        const items = db.select().from(recurringTransactions)
            .where(eq(recurringTransactions.userId, userId))
            .all();

        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("Error fetching recurring transactions:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch recurring transactions" }, { status: 500 });
    }
}

// POST - create a new recurring transaction
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { amount, description, categoryId, type, frequency } = body;

        if (!amount || !description || !frequency) {
            return NextResponse.json({ error: "amount, description, dan frequency wajib diisi" }, { status: 400 });
        }

        // Calculate first nextRunAt based on frequency
        const now = new Date();
        let nextRunAt: Date;
        if (frequency === "daily") {
            nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (frequency === "weekly") {
            nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else {
            // monthly
            nextRunAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }

        const db = getDb();

        const allCategories = await getCategories();
        const catId = categoryId || allCategories.find(c => c.name === "Lainnya")?.id || allCategories[0]?.id;

        const item = db.insert(recurringTransactions).values({
            userId,
            amount,
            description,
            categoryId: catId,
            type: type || "expense",
            frequency,
            nextRunAt,
            isActive: true,
        }).returning().get();

        return NextResponse.json({ success: true, data: item });
    } catch (error) {
        console.error("Error creating recurring transaction:", error);
        return NextResponse.json({ success: false, error: "Failed to create recurring transaction" }, { status: 500 });
    }
}
