"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TransactionWithCategory } from "@/types";
import { formatCurrency } from "@/frontend/lib/utils";
import { useToast } from "@/frontend/components/UI";
import { format } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { UseExportReturn } from "../types";

export function useExport(): UseExportReturn {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Close export menu on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                exportMenuRef.current &&
                !exportMenuRef.current.contains(e.target as Node)
            ) {
                setShowExportMenu(false);
            }
        }
        if (showExportMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showExportMenu]);

    const handleExportCSV = useCallback(
        (searchQuery: string, filterCategory: number | "all") => {
            setShowExportMenu(false);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (filterCategory !== "all") {
                params.append("categoryId", filterCategory.toString());
            }

            const a = document.createElement("a");
            a.href = `/api/transactions/export/csv?${params.toString()}`;
            a.download = `transaksi_${format(new Date(), "yyyyMMdd")}.csv`;
            a.click();
            toast.success("Export CSV berhasil");
        },
        [toast]
    );

    const handleExportPDF = useCallback(
        (transactions: TransactionWithCategory[], locale: string) => {
            setShowExportMenu(false);
            if (transactions.length === 0) {
                toast.error("Tidak ada data untuk diexport");
                return;
            }

            const dateLocale = locale === "id" ? idLocale : enUS;
            const rows = transactions.map((t) => {
                const dateStr = format(new Date(t.createdAt), "dd MMM yyyy", {
                    locale: dateLocale,
                });
                const type =
                    t.type === "expense"
                        ? "Pengeluaran"
                        : t.type === "income"
                            ? "Pemasukan"
                            : "Lainnya";
                return {
                    dateStr,
                    desc: t.description || "-",
                    cat: t.categoryName || "Lainnya",
                    type,
                    amount: formatCurrency(t.amount),
                };
            });

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                toast.error("Popup diblokir", "Izinkan popup untuk mencetak");
                return;
            }

            const totalIncome = transactions
                .filter((t) => t.type === "income")
                .reduce((s, t) => s + t.amount, 0);
            const totalExpense = transactions
                .filter((t) => t.type === "expense")
                .reduce((s, t) => s + t.amount, 0);

            const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Laporan Transaksi - Monev</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;margin:40px;color:#1e293b}
h1{font-size:20px;margin-bottom:4px}
.subtitle{color:#64748b;font-size:12px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f1f5f9;text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;font-weight:600}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
tr:nth-child(even){background:#fafafa}
.amount{text-align:right;font-variant-numeric:tabular-nums}
.summary{margin-top:24px;display:flex;gap:32px;font-size:13px}
.summary span{font-weight:600}
.income{color:#16a34a}
.expense{color:#dc2626}
@media print{body{margin:20px}button{display:none!important}}
</style></head><body>
<h1>Laporan Transaksi</h1>
<p class="subtitle">Diekspor pada ${format(new Date(), "dd MMMM yyyy, HH:mm", { locale: dateLocale })} &bull; ${transactions.length} transaksi</p>
<table>
<thead><tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Tipe</th><th class="amount">Jumlah</th></tr></thead>
<tbody>${rows.map((r) => `<tr><td>${r.dateStr}</td><td>${r.desc}</td><td>${r.cat}</td><td>${r.type}</td><td class="amount">${r.amount}</td></tr>`).join("")}</tbody>
</table>
<div class="summary">
<div>Pemasukan: <span class="income">${formatCurrency(totalIncome)}</span></div>
<div>Pengeluaran: <span class="expense">${formatCurrency(totalExpense)}</span></div>
<div>Selisih: <span>${formatCurrency(totalIncome - totalExpense)}</span></div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

            printWindow.document.write(html);
            printWindow.document.close();
            toast.success("PDF siap dicetak");
        },
        [toast]
    );

    return {
        showExportMenu,
        setShowExportMenu,
        exportMenuRef,
        handleExportCSV,
        handleExportPDF,
    };
}
