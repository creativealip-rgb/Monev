import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions, budgets, goals } from "@/backend/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";

    const db = getDb();

    try {
        // Fetch all user data
        const userTransactions = await db.select()
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.date))
            .all();

        if (format === "csv" || format === "bca_csv" || format === "mandiri_csv") {
            // Escape commas helper
            const escapeCsv = (str: string | null | undefined) => {
                if (!str) return '""';
                const cleaned = String(str).replace(/"/g, '""');
                return `"${cleaned}"`;
            };

            let headers: string[] = [];
            let csvRows: string[] = [];

            if (format === "bca_csv") {
                headers = ["Tanggal", "Keterangan", "Cabang", "Jumlah", "Tipe", "Saldo"];
                csvRows = [headers.join(",")];
                for (const t of userTransactions) {
                    const row = [
                        t.date ? new Date(t.date).toLocaleDateString("id-ID") : "",
                        escapeCsv(`${t.description} ${t.merchantName || ""}`),
                        "0000", // Default branch
                        t.amount,
                        t.type === "income" ? "CR" : "DB",
                        "0" // Balance after (not tracked in DB)
                    ];
                    csvRows.push(row.join(","));
                }
            } else if (format === "mandiri_csv") {
                headers = ["Tanggal", "Keterangan", "No Reff", "Debet", "Kredit", "Saldo"];
                csvRows = [headers.join(",")];
                for (const t of userTransactions) {
                    const row = [
                        t.date ? new Date(t.date).toLocaleDateString("id-ID") : "",
                        escapeCsv(t.description),
                        escapeCsv(t.id.toString()),
                        t.type === "expense" ? t.amount : "0",
                        t.type === "income" ? t.amount : "0",
                        "0"
                    ];
                    csvRows.push(row.join(","));
                }
            } else {
                // Default Monev CSV
                headers = ["ID", "Tanggal", "Tipe", "Nominal", "Deskripsi", "Merchant", "Metode Pembayaran", "Biaya Admin"];
                csvRows = [headers.join(",")];
                for (const t of userTransactions) {
                    const dateParam = t.date ? new Date(t.date).toISOString().split('T')[0] : "";
                    const row = [
                        t.id,
                        escapeCsv(dateParam),
                        escapeCsv(t.type),
                        t.amount,
                        escapeCsv(t.description),
                        escapeCsv(t.merchantName),
                        escapeCsv(t.paymentMethod),
                        t.fee || 0
                    ];
                    csvRows.push(row.join(","));
                }
            }

            const csvContent = csvRows.join("\n");
            const filename = format === "bca_csv" ? "BCA_Statement" : format === "mandiri_csv" ? "Mandiri_Statement" : "monev_transactions";

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // Default JSON export
        const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, userId)).all();
        const userGoals = await db.select().from(goals).where(eq(goals.userId, userId)).all();

        const data = {
            exportDate: new Date().toISOString(),
            user: { id: userId, email: session.user.email },
            data: {
                transactions: userTransactions,
                budgets: userBudgets,
                goals: userGoals
            }
        };

        return new NextResponse(JSON.stringify(data, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="monev_data_export_${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ success: false, error: "Gagal memproses export data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const db = getDb();

    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return NextResponse.json({ success: false, error: "Data backup tidak valid" }, { status: 400 });
        }

        // Transactions Restore
        if (data.transactions && Array.isArray(data.transactions)) {
            for (const t of data.transactions) {
                // Remove id to let DB auto-increment or keep it if you want to overwrite?
                // For restore, we usually want to avoid duplicates.
                // Simple strategy: insert if not exists (checked by date/amount/desc) or just append.
                const { id, ...transData } = t;
                await db.insert(transactions).values({
                    ...transData,
                    userId,
                    createdAt: transData.createdAt ? new Date(transData.createdAt) : new Date(),
                    updatedAt: new Date()
                }).onConflictDoNothing();
            }
        }

        // Budgets Restore
        if (data.budgets && Array.isArray(data.budgets)) {
            for (const b of data.budgets) {
                const { id, ...budgetData } = b;
                await db.insert(budgets).values({
                    ...budgetData,
                    userId,
                    createdAt: budgetData.createdAt ? new Date(budgetData.createdAt) : new Date(),
                    updatedAt: new Date()
                }).onConflictDoNothing();
            }
        }

        // Goals Restore
        if (data.goals && Array.isArray(data.goals)) {
            for (const g of data.goals) {
                const { id, ...goalData } = g;
                await db.insert(goals).values({
                    ...goalData,
                    userId,
                    createdAt: goalData.createdAt ? new Date(goalData.createdAt) : new Date(),
                    updatedAt: new Date()
                }).onConflictDoNothing();
            }
        }

        return NextResponse.json({ success: true, message: "Data berhasil di-restore" });

    } catch (error) {
        console.error("Restore error:", error);
        return NextResponse.json({ success: false, error: "Gagal me-restore data" }, { status: 500 });
    }
}
