import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions } from "@/backend/db/schema";
import { and, eq, gte, lte, notLike } from "drizzle-orm";

function getUserId(session: Awaited<ReturnType<typeof auth>>) {
    const id = session?.user?.id;
    return id ? Number(id) : null;
}

function monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number) {
    return new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

export async function GET() {
    try {
        const session = await auth();
        const userId = getUserId(session);
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const rows = await getDb()
            .select({ amount: transactions.amount, type: transactions.type, date: transactions.date })
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                gte(transactions.date, start),
                lte(transactions.date, end),
                notLike(transactions.description, "[OPENING_BALANCE]%"),
                notLike(transactions.description, "[BALANCE_ADJUSTMENT]%"),
            ))
            .all();

        const history = new Map<string, { income: number; expense: number }>();
        for (let index = 5; index >= 0; index--) {
            const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
            history.set(monthKey(date), { income: 0, expense: 0 });
        }

        for (const row of rows) {
            const key = monthKey(new Date(row.date));
            const bucket = history.get(key);
            if (!bucket) continue;
            if (row.type === "income" || row.type === "withdraw") bucket.income += Number(row.amount || 0);
            if (row.type === "expense") bucket.expense += Number(row.amount || 0);
        }

        const monthly = Array.from(history.entries()).map(([key, value]) => {
            const [year, month] = key.split("-").map(Number);
            return {
                key,
                label: monthLabel(year, month),
                income: Math.round(value.income),
                expense: Math.round(value.expense),
                balance: Math.round(value.income - value.expense),
            };
        });

        const activeMonths = monthly.filter(item => item.income > 0 || item.expense > 0);
        const baseline = activeMonths.length > 0 ? activeMonths : monthly;
        const avgIncome = baseline.reduce((sum, item) => sum + item.income, 0) / Math.max(1, baseline.length);
        const avgExpense = baseline.reduce((sum, item) => sum + item.expense, 0) / Math.max(1, baseline.length);
        const avgBalance = avgIncome - avgExpense;

        const forecast = Array.from({ length: 3 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
            const conservativeExpense = avgExpense * (1 + 0.05 * (index + 1));
            return {
                key: monthKey(date),
                label: monthLabel(date.getFullYear(), date.getMonth() + 1),
                projectedIncome: Math.round(avgIncome),
                projectedExpense: Math.round(conservativeExpense),
                projectedBalance: Math.round(avgIncome - conservativeExpense),
            };
        });

        const trend = avgBalance >= 0 ? "positive" : "warning";
        const summary = trend === "positive"
            ? "Cashflow rata-rata masih positif. Pertahankan ritme pengeluaran agar surplus tetap aman."
            : "Cashflow rata-rata negatif. Prioritaskan kategori wajib dan tahan pengeluaran fleksibel.";

        return NextResponse.json({
            success: true,
            data: {
                monthly,
                forecast,
                averageIncome: Math.round(avgIncome),
                averageExpense: Math.round(avgExpense),
                averageBalance: Math.round(avgBalance),
                trend,
                summary,
            },
        });
    } catch (error) {
        console.error("Error loading cashflow forecast:", error);
        return NextResponse.json({ success: false, error: "Gagal memuat forecast" }, { status: 500 });
    }
}
