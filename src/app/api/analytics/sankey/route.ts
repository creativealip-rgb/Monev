import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategories, searchTransactions } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get("month");
        const yearParam = searchParams.get("year");
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const accountIdParam = searchParams.get("accountId");
        const categoryIdParam = searchParams.get("categoryId");
        let startDate: Date;
        let endDate: Date;

        if (startDateParam && endDateParam) {
            startDate = new Date(`${startDateParam}T00:00:00.000Z`);
            endDate = new Date(`${endDateParam}T23:59:59.999Z`);
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
                return NextResponse.json({ success: false, error: "Rentang tanggal tidak valid" }, { status: 400 });
            }
        } else if (monthParam && monthParam.includes("-")) {
            const [yearStr, monthStr] = monthParam.split("-");
            const parsedYear = parseInt(yearStr, 10);
            const parsedMonth = parseInt(monthStr, 10);
            if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
                return NextResponse.json({ success: false, error: "Parameter bulan tidak valid" }, { status: 400 });
            }
            startDate = new Date(parsedYear, parsedMonth - 1, 1);
            endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
        } else if (monthParam && yearParam) {
            const parsedMonth = parseInt(monthParam, 10);
            const parsedYear = parseInt(yearParam, 10);
            if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
                return NextResponse.json({ success: false, error: "Parameter bulan/tahun tidak valid" }, { status: 400 });
            }
            startDate = new Date(parsedYear, parsedMonth - 1, 1);
            endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Fetch user data
        const categories = await getCategories(userId);
        const selectedAccountId = accountIdParam ? parseInt(accountIdParam, 10) : null;
        const selectedCategoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : null;
        const filteredTransactions = await searchTransactions(userId, {
            limit: 5000,
            offset: 0,
            accountId: selectedAccountId || undefined,
            categoryId: selectedCategoryId || undefined,
            startDate,
            endDate,
            type: "all",
        });

        // Compute Totals
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals: Record<number, number> = {};
        let uncategorizedExpense = 0;

        for (const t of filteredTransactions) {
            if (t.type === "income") {
                totalIncome += t.amount;
            } else if (t.type === "expense") {
                totalExpense += t.amount;
                if (t.categoryId) {
                    categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
                } else {
                    uncategorizedExpense += t.amount;
                }
            }
        }

        const balance = totalIncome - totalExpense;
        // Build Nodes and Links for Sankey
        // Structure: Income -> (Categories) & (Balance/Savings if positive)
        const nodes: Array<{
            name: string;
            kind: "income" | "expense-category" | "uncategorized-expense" | "savings";
            categoryId?: number;
        }> = [];
        const links: Array<{
            source: number;
            target: number;
            value: number;
            kind: "income-to-category" | "income-to-uncategorized" | "income-to-savings";
            categoryId?: number;
            targetName: string;
        }> = [];

        let nodeIndex = 0;

        // Node 0: Income Source
        nodes.push({ name: "Total Pemasukan", kind: "income" });
        const incomeNodeId = nodeIndex++;

        // Process Categories (Expenses)
        for (const cat of categories) {
            if (categoryTotals[cat.id] && categoryTotals[cat.id] > 0) {
                nodes.push({ name: cat.name, kind: "expense-category", categoryId: cat.id });
                links.push({
                    source: incomeNodeId,
                    target: nodeIndex,
                    value: categoryTotals[cat.id],
                    kind: "income-to-category",
                    categoryId: cat.id,
                    targetName: cat.name,
                });
                nodeIndex++;
            }
        }

        // Process Uncategorized Expenses
        if (uncategorizedExpense > 0) {
            nodes.push({ name: "Pengeluaran Lainnya", kind: "uncategorized-expense" });
            links.push({
                source: incomeNodeId,
                target: nodeIndex,
                value: uncategorizedExpense,
                kind: "income-to-uncategorized",
                targetName: "Pengeluaran Lainnya",
            });
            nodeIndex++;
        }

        // Process Unspent Balance (Tabungan/Sisa)
        if (balance > 0) {
            nodes.push({ name: "Sisa / Tersimpan", kind: "savings" });
            links.push({
                source: incomeNodeId,
                target: nodeIndex,
                value: balance,
                kind: "income-to-savings",
                targetName: "Sisa / Tersimpan",
            });
            nodeIndex++;
        }

        // If no income but there are expenses (Deficit/Using Savings)
        // We adjust the visualization to flow from "Tabungan" -> Expenses
        if (totalIncome === 0 && totalExpense > 0) {
            nodes[0].name = "Saldo Awal / Dana Tersimpan";
            // The links remain the same conceptually, just the root node name changes
        }

        return NextResponse.json({
            success: true,
            data: {
                nodes,
                links,
                totalIncome,
                totalExpense,
                balance
            }
        });

    } catch (error) {
        console.error("Error generating sankey data:", error);
        return NextResponse.json(
            { success: false, error: "Gagal mengambil data aliran kas" },
            { status: 500 }
        );
    }
}
