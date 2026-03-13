import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions, categories, investments } from "@/backend/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { generateWealthReport } from "@/lib/report-generator";
import { getFinancialInsights } from "@/lib/ai";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const name = session.user.name || "Bos";

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "monthly";
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        let dateFrom: Date;
        let dateTo: Date;

        if (type === "custom" && startDate && endDate) {
            dateFrom = new Date(startDate);
            dateTo = new Date(endDate);
        } else if (type === "annual") {
            dateFrom = new Date(year, 0, 1);
            dateTo = new Date(year, 11, 31, 23, 59, 59);
        } else {
            dateFrom = new Date(year, month - 1, 1);
            dateTo = new Date(year, month, 0, 23, 59, 59);
        }

        const db = getDb();

        const txns = await db
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    gte(transactions.date, dateFrom),
                    lte(transactions.date, dateTo)
                )
            );

        const income = txns
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = txns
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expense;

        const categoryBreakdown = await db
            .select({
                categoryId: transactions.categoryId,
                type: transactions.type,
                total: sql<number>`SUM(${transactions.amount})`.mapWith(Number),
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    gte(transactions.date, dateFrom),
                    lte(transactions.date, dateTo)
                )
            )
            .groupBy(transactions.categoryId, transactions.type);

        const categoryDetails = await db
            .select()
            .from(categories)
            .where(eq(categories.userId, userId));

        const categoriesWithNames = categoryBreakdown.map((cb) => {
            const cat = categoryDetails.find((c) => c.id === cb.categoryId);
            return {
                name: cat?.name || "Lainnya",
                amount: cb.total,
                type: cb.type as "income" | "expense",
            };
        });

        const allocations = [
            {
                name: "Kebutuhan (50%)",
                amount: categoryBreakdown
                    .filter((cb) => cb.type === "expense")
                    .reduce((sum, cb) => sum + cb.total, 0) * 0.5,
                percentage: 0,
                target: 50,
            },
            {
                name: "Keinginan (30%)",
                amount: categoryBreakdown
                    .filter((cb) => cb.type === "expense")
                    .reduce((sum, cb) => sum + cb.total, 0) * 0.3,
                percentage: 0,
                target: 30,
            },
            {
                name: "Tabungan (20%)",
                amount: categoryBreakdown
                    .filter((cb) => cb.type === "expense")
                    .reduce((sum, cb) => sum + cb.total, 0) * 0.2,
                percentage: 0,
                target: 20,
            },
        ].map((a) => ({
            ...a,
            percentage: expense > 0 ? (a.amount / expense) * 100 : 0,
        }));

        const userInvestments = await db
            .select()
            .from(investments)
            .where(eq(investments.userId, userId));

        const investmentsData = userInvestments.map((i) => ({
            name: i.name,
            type: i.type,
            value: i.quantity * i.currentPrice,
        }));

        const aiInsight = await getFinancialInsights({
            income,
            expense,
            balance,
            allocations: allocations.map((a) => ({ ...a, color: "#3b82f6" })),
            categoryBreakdown: {
                expense: categoriesWithNames
                    .filter((c) => c.type === "expense")
                    .map((c) => ({ name: c.name, amount: c.amount, color: "#3b82f6", icon: "Wallet" })),
                income: categoriesWithNames
                    .filter((c) => c.type === "income")
                    .map((c) => ({ name: c.name, amount: c.amount, color: "#10b981", icon: "TrendingUp" })),
            },
        });

        const reportData = {
            userName: name,
            month: type === "annual" ? "Tahunan" : new Date(year, month - 1).toLocaleString("id-ID", { month: "long" }),
            year,
            stats: { income, expense, balance },
            allocations,
            categories: categoriesWithNames,
            investments: investmentsData,
            aiInsight: typeof aiInsight === "object" && aiInsight !== null ? (aiInsight as { content?: string }).content || "" : (aiInsight as string),
        };

        const doc = await generateWealthReport(reportData);
        const pdfOutput = doc.output("arraybuffer");

        const periodLabel = type === "annual"
            ? `${year}`
            : type === "custom"
            ? `${startDate} - ${endDate}`
            : `${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`;

        const filename = `Monev_Laporan_${periodLabel.replace(/ /g, "_")}.pdf`;

        return new NextResponse(pdfOutput, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal membuat laporan";
        console.error("Report Generation Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
