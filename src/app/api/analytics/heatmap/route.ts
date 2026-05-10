import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions } from "@/backend/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

function getUserId(session: Awaited<ReturnType<typeof auth>>) {
    const id = session?.user?.id;
    return id ? Number(id) : null;
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
    try {
        const session = await auth();
        const userId = getUserId(session);
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = Number(searchParams.get("year") || now.getFullYear());
        const month = Number(searchParams.get("month") || now.getMonth() + 1);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const rows = await getDb()
            .select({ amount: transactions.amount, date: transactions.date })
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                eq(transactions.type, "expense"),
                gte(transactions.date, start),
                lte(transactions.date, end),
            ))
            .all();

        const byDate = new Map<string, number>();
        for (const row of rows) {
            const key = toDateKey(new Date(row.date));
            byDate.set(key, (byDate.get(key) || 0) + Number(row.amount || 0));
        }

        const days = Array.from({ length: end.getDate() }, (_, index) => {
            const date = new Date(year, month - 1, index + 1);
            const dateKey = toDateKey(date);
            return {
                date: dateKey,
                day: index + 1,
                weekday: date.getDay(),
                amount: Math.round((byDate.get(dateKey) || 0) * 100) / 100,
            };
        });
        const maxAmount = days.reduce((max, item) => Math.max(max, item.amount), 0);
        const totalAmount = days.reduce((sum, item) => sum + item.amount, 0);
        const activeDays = days.filter(item => item.amount > 0).length;

        return NextResponse.json({
            success: true,
            data: {
                year,
                month,
                totalAmount,
                maxAmount,
                activeDays,
                days: days.map(item => ({
                    ...item,
                    intensity: maxAmount > 0 ? Math.ceil((item.amount / maxAmount) * 4) : 0,
                })),
            },
        });
    } catch (error) {
        console.error("Error loading spending heatmap:", error);
        return NextResponse.json({ success: false, error: "Gagal memuat heatmap" }, { status: 500 });
    }
}
