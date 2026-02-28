import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTransactions, getCategories } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const monthStr = searchParams.get('month');
        let startDate, endDate;

        if (monthStr) {
            const [year, month] = monthStr.split('-');
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            endDate = new Date(parseInt(year), parseInt(month), 0);
        } else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
        }

        // Fetch user data
        const transactions = await getTransactions(userId, 5000); // Fetch a lot to guarantee we get the month's data
        const categories = await getCategories(userId);

        // Filter by date
        const filteredTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startDate && tDate <= endDate;
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
        const totalSource = totalIncome > 0 ? totalIncome : 1; // Prevent zero division, fallback to 1

        // Build Nodes and Links for Sankey
        // Structure: Income -> (Categories) & (Balance/Savings if positive)
        const nodes: { name: string, category?: string }[] = [];
        const links: { source: number, target: number, value: number }[] = [];

        let nodeIndex = 0;

        // Node 0: Income Source
        nodes.push({ name: "Total Pemasukan" });
        const incomeNodeId = nodeIndex++;

        // Process Categories (Expenses)
        for (const cat of categories) {
            if (categoryTotals[cat.id] && categoryTotals[cat.id] > 0) {
                nodes.push({ name: cat.name });
                links.push({
                    source: incomeNodeId,
                    target: nodeIndex,
                    value: categoryTotals[cat.id]
                });
                nodeIndex++;
            }
        }

        // Process Uncategorized Expenses
        if (uncategorizedExpense > 0) {
            nodes.push({ name: "Pengeluaran Lainnya" });
            links.push({
                source: incomeNodeId,
                target: nodeIndex,
                value: uncategorizedExpense
            });
            nodeIndex++;
        }

        // Process Unspent Balance (Tabungan/Sisa)
        if (balance > 0) {
            nodes.push({ name: "Sisa / Tersimpan" });
            links.push({
                source: incomeNodeId,
                target: nodeIndex,
                value: balance
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
