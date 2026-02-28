import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTransactions, getCategories } from "@/backend/db/operations";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        // We set a high limit for export, or we could fetch all by removing limit
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10000;
        const search = searchParams.get("search") || undefined;

        // Fetch transactions & categories
        const transactions = await getTransactions(userId, limit, 0, search);
        const categories = await getCategories(userId);

        // Define CSV headers
        const headers = ["Tanggal", "Merchant", "Kategori", "Tipe", "Nominal", "Deskripsi"];

        // Convert data to CSV string
        const csvRows = [];
        csvRows.push(headers.join(",")); // Add headers

        for (const t of transactions) {
            // Escape quotes and wrap in quotes to handle commas in descriptions/merchants
            const date = new Date(t.date).toISOString().split('T')[0];
            const merchant = `"${(t.merchantName || "").replace(/"/g, '""')}"`;

            const categoryObj = categories.find(c => c.id === t.categoryId);
            const category = categoryObj ? `"${categoryObj.name.replace(/"/g, '""')}"` : "Lainnya";

            const type = t.type === "expense" ? "Pengeluaran" : t.type === "income" ? "Pemasukan" : "Lainnya";
            const amount = t.amount;
            const description = `"${(t.description || "").replace(/"/g, '""')}"`;

            csvRows.push(`${date},${merchant},${category},${type},${amount},${description}`);
        }

        const csvString = csvRows.join("\n");

        // Return as a downloadable CSV file
        return new NextResponse(csvString, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="monev_transactions_${new Date().toISOString().split('T')[0]}.csv"`,
            }
        });

    } catch (error) {
        console.error("Error exporting transactions to CSV:", error);
        return NextResponse.json(
            { success: false, error: "Gagal mengekspor data" },
            { status: 500 }
        );
    }
}
