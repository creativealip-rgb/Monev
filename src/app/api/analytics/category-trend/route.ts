import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { categories, transactions } from "@/backend/db/schema";
import { and, eq, gte, lte, notLike } from "drizzle-orm";

type CategoryBucket = {
    categoryId: number;
    categoryName: string;
    color: string;
    icon: string | null;
    monthly: number[];
};

function getUserId(session: Awaited<ReturnType<typeof auth>>) {
    const id = session?.user?.id;
    return id ? Number(id) : null;
}

function monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
    return date.toLocaleDateString("id-ID", { month: "short" });
}

function trendFromValues(values: number[]) {
    const first = values.find((value) => value > 0) ?? 0;
    const last = values[values.length - 1] ?? 0;
    if (first === 0 && last === 0) return { direction: "stable", changePercent: 0 };
    if (first === 0) return { direction: "up", changePercent: 100 };
    const changePercent = Math.round(((last - first) / first) * 100);
    const direction = changePercent > 10 ? "up" : changePercent < -10 ? "down" : "stable";
    return { direction, changePercent };
}

export async function GET() {
    try {
        const session = await auth();
        const userId = getUserId(session);
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const months = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
            return { key: monthKey(date), label: monthLabel(date), date };
        });
        const start = months[0]?.date ?? new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const rows = await getDb()
            .select({
                amount: transactions.amount,
                date: transactions.date,
                categoryId: categories.id,
                categoryName: categories.name,
                color: categories.color,
                icon: categories.icon,
            })
            .from(transactions)
            .innerJoin(categories, eq(transactions.categoryId, categories.id))
            .where(and(
                eq(transactions.userId, userId),
                eq(transactions.type, "expense"),
                gte(transactions.date, start),
                lte(transactions.date, end),
                notLike(transactions.description, "[OPENING_BALANCE]%"),
                notLike(transactions.description, "[BALANCE_ADJUSTMENT]%"),
            ))
            .all();

        const monthIndex = new Map(months.map((item, index) => [item.key, index]));
        const buckets = new Map<number, CategoryBucket>();

        for (const row of rows) {
            const key = monthKey(new Date(row.date));
            const index = monthIndex.get(key);
            if (index === undefined) continue;

            if (!buckets.has(row.categoryId)) {
                buckets.set(row.categoryId, {
                    categoryId: row.categoryId,
                    categoryName: row.categoryName,
                    color: row.color || "#64748b",
                    icon: row.icon,
                    monthly: Array(months.length).fill(0),
                });
            }

            buckets.get(row.categoryId)!.monthly[index] += Number(row.amount || 0);
        }

        const categoriesTrend = Array.from(buckets.values())
            .map((bucket) => {
                const total = bucket.monthly.reduce((sum, value) => sum + value, 0);
                const average = total / Math.max(1, bucket.monthly.filter((value) => value > 0).length || months.length);
                const latest = bucket.monthly[bucket.monthly.length - 1] ?? 0;
                const forecastNextMonth = Math.round((latest * 0.6) + (average * 0.4));
                return {
                    ...bucket,
                    monthly: bucket.monthly.map(Math.round),
                    total: Math.round(total),
                    average: Math.round(average),
                    forecastNextMonth,
                    ...trendFromValues(bucket.monthly),
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        const chartData = months.map((month, index) => {
            const point: Record<string, string | number> = { month: month.label, key: month.key };
            for (const item of categoriesTrend) {
                point[item.categoryName] = item.monthly[index] || 0;
            }
            return point;
        });

        return NextResponse.json({
            success: true,
            data: {
                months,
                categories: categoriesTrend,
                chartData,
            },
        });
    } catch (error) {
        console.error("Error loading category trend:", error);
        return NextResponse.json({ success: false, error: "Gagal memuat tren kategori" }, { status: 500 });
    }
}
