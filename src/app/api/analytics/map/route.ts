import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions, categories, goals, investments } from "@/backend/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const url = new URL(request.url);
        const month = parseInt(url.searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

        const db = getDb();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Fetch all transactions for the month
        const monthlyTransactions = db.select({
            id: transactions.id,
            amount: transactions.amount,
            type: transactions.type,
            categoryId: transactions.categoryId,
            description: transactions.description,
            merchantName: transactions.merchantName,
        })
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            ))
            .all();

        // Fetch categories for mapping names
        const allCategories = db.select().from(categories).all();
        const categoryMap = new Map(allCategories.map(c => [c.id, c]));

        const nodes: { id: string, name: string, color?: string }[] = [];
        const links: { source: string, target: string, value: number }[] = [];

        // Central Hubs
        const INFLOW_NODE = "inflow";
        const OUTFLOW_NODE = "outflow";
        const SAVINGS_NODE = "savings_hub";
        const INVEST_NODE = "invest_hub";

        nodes.push({ id: INFLOW_NODE, name: "Total Income", color: "#10b981" });
        nodes.push({ id: OUTFLOW_NODE, name: "Allocation", color: "#3b82f6" });

        const incomeSources: Record<string, number> = {};
        const expenseCategories: Record<string, number> = {};
        let totalIncome = 0;
        let totalExpense = 0;

        monthlyTransactions.forEach(tx => {
            if (tx.type === "income") {
                const source = tx.merchantName || tx.description || "Other Income";
                incomeSources[source] = (incomeSources[source] || 0) + tx.amount;
                totalIncome += tx.amount;
            } else if (tx.type === "expense") {
                const cat = (tx.categoryId !== null ? categoryMap.get(tx.categoryId)?.name : null) || "Uncategorized";
                expenseCategories[cat] = (expenseCategories[cat] || 0) + tx.amount;
                totalExpense += tx.amount;
            }
        });

        // 1. Links from Income Sources to Inflow Hub
        Object.entries(incomeSources).forEach(([name, amount]) => {
            const nodeId = `income_${name.replace(/\s+/g, '_')}`;
            nodes.push({ id: nodeId, name });
            links.push({ source: nodeId, target: INFLOW_NODE, value: amount });
        });

        // 2. Link from Inflow to Outflow (The bridge)
        if (totalIncome > 0) {
            links.push({ source: INFLOW_NODE, target: OUTFLOW_NODE, value: totalIncome });
        }

        // 3. Links from Outflow to Expense Categories
        let hasExpenses = false;
        Object.entries(expenseCategories).forEach(([name, amount]) => {
            const nodeId = `expense_${name.replace(/\s+/g, '_')}`;
            nodes.push({ id: nodeId, name });
            links.push({ source: OUTFLOW_NODE, target: nodeId, value: amount });
            hasExpenses = true;
        });

        // 4. Savings & Investment integration (If we have specific month-based data, 
        // otherwise we can look for specific transactions that hit goals/investment accounts)
        // For now, let's look for transactions categorized as "Savings" or "Investment" if they exist
        // or just calculate the remainder as "Idle / Monthly Savings"
        const remainder = totalIncome - totalExpense;
        if (remainder > 0) {
            nodes.push({ id: "idle_cash", name: "Sisa Saldo / Tabungan", color: "#8b5cf6" });
            links.push({ source: OUTFLOW_NODE, target: "idle_cash", value: remainder });
        }

        return NextResponse.json({
            success: true,
            data: { nodes, links }
        });

    } catch (error) {
        console.error("Financial Map API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to generate financial map data" }, { status: 500 });
    }
}
