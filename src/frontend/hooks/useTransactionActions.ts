"use client";

import { useState } from "react";
import { TransactionWithCategory } from "@/types";
import { format } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { cn, formatCurrency } from "@/frontend/lib/utils";

export function useBulkActions(
    filteredTransactions: TransactionWithCategory[],
    refresh: () => Promise<void>,
    toast: any
) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredTransactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
        }
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setShowBulkActions(false);
    };

    return {
        selectedIds,
        showBulkActions,
        setShowBulkActions,
        toggleSelectAll,
        toggleSelect,
        clearSelection,
        selectedCount: selectedIds.size
    };
}

export function useTransactionExport(
    filteredTransactions: TransactionWithCategory[],
    searchQuery: string,
    filterCategory: string | number,
    toast: any,
    locale: string
) {
    const exportSelectedCSV = (ids: number[]) => {
        const params = new URLSearchParams();
        ids.forEach(id => params.append("ids", id.toString()));

        const a = document.createElement("a");
        a.href = `/api/transactions/export/csv?${params.toString()}`;
        a.download = "monev_transaksi_selected.csv";
        a.click();
        toast.success(`${ids.length} transaksi diexport`);
    };

    const exportFilteredCSV = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (filterCategory !== "all") {
            params.append("categoryId", filterCategory.toString());
        }

        const a = document.createElement("a");
        a.href = `/api/transactions/export/csv?${params.toString()}`;
        a.download = `transaksi_${format(new Date(), "yyyyMMdd")}.csv`;
        a.click();
        toast.success("CSV berhasil diunduh");
    };

    const exportToPDF = () => {
        if (filteredTransactions.length === 0) {
            toast.error("Tidak ada data", "Tidak ada transaksi untuk diexport");
            return;
        }

        const dateLocale = locale === "id" ? idLocale : enUS;
        const rows = filteredTransactions.map((t) => {
            const dateStr = format(new Date(t.createdAt), "dd MMM yyyy", {
                locale: dateLocale,
            });
            const type = t.type === "expense"
                ? "Pengeluaran"
                : t.type === "income"
                    ? "Pemasukan"
                    : "Lainnya";
            return { dateStr, desc: t.description || "-", cat: t.categoryName || "Lainnya", type, amount: formatCurrency(t.amount) };
        });

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Popup diblokir", "Izinkan popup untuk export PDF");
            return;
        }

        const totalIncome = filteredTransactions
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0);
        const totalExpense = filteredTransactions
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
<p class="subtitle">Diekspor pada ${format(new Date(), "dd MMMM yyyy, HH:mm", { locale: dateLocale })} &bull; ${filteredTransactions.length} transaksi</p>
<table>
<thead><tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Tipe</th><th class="amount">Jumlah</th></tr></thead>
<tbody>${rows.map(r => `<tr><td>${r.dateStr}</td><td>${r.desc}</td><td>${r.cat}</td><td>${r.type}</td><td class="amount">${r.amount}</td></tr>`).join("")}</tbody>
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
    };

    return {
        exportSelectedCSV,
        exportFilteredCSV,
        exportToPDF
    };
}
