import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions, budgets, goals, categories, accounts, bills, userSettings } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { format = "json" } = body;

        const db = getDb();

        // Fetch all user data
        const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));
        const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, userId));
        const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
        const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
        const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
        const userBills = await db.select().from(bills).where(eq(bills.userId, userId));
        const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId));

        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                id: userId,
                exportDate: new Date().toISOString()
            },
            transactions: userTransactions,
            budgets: userBudgets,
            goals: userGoals,
            categories: userCategories,
            accounts: userAccounts,
            bills: userBills,
            settings: settings[0] || null
        };

        if (format === "json") {
            return NextResponse.json({
                success: true,
                data: exportData
            });
        }

        if (format === "csv") {
            // Very basic CSV generation for transactions
            const headers = ["Date", "Description", "Amount", "Type", "Category"];
            const rows = userTransactions.map(t => [
                new Date(t.date).toLocaleDateString(),
                t.description,
                t.amount,
                t.type,
                userCategories.find(c => c.id === t.categoryId)?.name || "Uncategorized"
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\n");

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="monev_export_${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // For Excel/PDF formats, return the structured data for frontend handling
        return NextResponse.json({
            success: true,
            data: exportData,
            supportedFormats: ["json", "csv", "xlsx", "pdf"]
        });
    } catch (error: any) {
        console.error("Export API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
