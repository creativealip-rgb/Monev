import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAnalysisData, getInvestments } from "@/backend/db/operations";
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
        const now = new Date();
        const year = parseInt(searchParams.get("year") || now.getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString());

        // 1. Gather Data
        const analysis = await getAnalysisData(userId, year, month);
        const investments = await getInvestments(userId);

        // 2. Fetch AI Insights
        const aiInsight = await getFinancialInsights({
            income: analysis.income,
            expense: analysis.expense,
            balance: analysis.balance,
            allocations: analysis.allocations as any,
            categoryBreakdown: {
                expense: analysis.categoryBreakdown.expense,
                income: analysis.categoryBreakdown.income
            }
        });

        // 3. Prepare Report Data
        const reportData = {
            userName: name,
            month: new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' }),
            year,
            stats: {
                income: analysis.income,
                expense: analysis.expense,
                balance: analysis.balance
            },
            allocations: analysis.allocations.map(a => ({
                name: a.name,
                amount: a.amount,
                percentage: a.percentage,
                target: a.target
            })),
            categories: [
                ...analysis.categoryBreakdown.expense.map(c => ({ ...c, type: "expense" as const })),
                ...analysis.categoryBreakdown.income.map(c => ({ ...c, type: "income" as const }))
            ],
            investments: investments.map(i => ({
                name: i.name,
                type: i.type,
                value: i.quantity * i.currentPrice
            })),
            aiInsight: aiInsight
        };

        // 4. Generate PDF
        const doc = await generateWealthReport(reportData);

        // 5. Build Buffer
        const pdfOutput = doc.output("arraybuffer");

        return new NextResponse(pdfOutput, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Monev_Report_${year}_${month}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("PDF Report Error:", error);
        return NextResponse.json({ error: "Gagal membuat laporan PDF" }, { status: 500 });
    }
}
