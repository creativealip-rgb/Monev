
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { transactions, categories, users } from "@/backend/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();
        const user = db.select().from(users).where(eq(users.email, session.user.email)).get();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const allCategories = db.select().from(categories).all();
        const catMap = new Map(allCategories.map(c => [c.id, c.name]));

        const allTransactions = db.select()
            .from(transactions)
            .where(eq(transactions.userId, user.id))
            .orderBy(desc(transactions.date))
            .all();

        // Build CSV
        const header = "Tanggal,Deskripsi,Kategori,Tipe,Jumlah,Metode Pembayaran,Merchant";
        const rows = allTransactions.map(t => {
            const dateStr = t.date instanceof Date
                ? format(t.date, "yyyy-MM-dd")
                : format(new Date(t.date as unknown as number * 1000), "yyyy-MM-dd");
            const category = catMap.get(t.categoryId || 0) || "Lainnya";
            const type = t.type === "income" ? "Pemasukan" : t.type === "transfer" ? "Transfer" : "Pengeluaran";
            const desc = `"${(t.description || "").replace(/"/g, '""')}"`;
            const merchant = `"${(t.merchantName || "").replace(/"/g, '""')}"`;
            return `${dateStr},${desc},${category},${type},${t.amount},${t.paymentMethod || "cash"},${merchant}`;
        });

        const csv = [header, ...rows].join("\n");
        const filename = `monev_transaksi_${format(new Date(), "yyyyMMdd")}.csv`;

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
