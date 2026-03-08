"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { EditTransactionForm } from "@/frontend/components/EditTransactionForm";
import { TransactionDetailModal } from "@/frontend/components/DetailModalsVerified";
import { TransactionListSkeleton, NoTransactionsEmpty, NoSearchResultsEmpty, useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { Filter, Search, ArrowLeft, X, Check, Loader2, Download, ChevronDown, Trash2, Square, CheckSquare, Calendar, ArrowUpDown, Upload, Undo2, FileText, FileSpreadsheet, AlertTriangle, Eye } from "lucide-react";
import { CSVImportWizard } from "@/frontend/components/CSVImportWizard";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TransactionWithCategory } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useTransactionsData } from "@/frontend/hooks/useTransactionsData";
import { useI18n } from "@/frontend/lib/i18n-context";
import { useDebouncedValue } from "@/frontend/hooks/useDebouncedValue";
import { enUS, id as idLocale } from "date-fns/locale";

import { TransactionFilterModal } from "./components/TransactionFilterModal";
import { TransactionSortMenu } from "./components/TransactionSortMenu";
import { BulkActionsBar } from "./components/BulkActionsBar";

import type { Category } from "./components/TransactionFilterModal";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function TransactionsPage() {
    const { t, locale } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
    const [filterCategory, setFilterCategory] = useState<number | "all">("all");
    const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Sorting
    const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Date range filter
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [amountRange, setAmountRange] = useState<{ min: number; max: number } | null>(null);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
    const [detailTransaction, setDetailTransaction] = useState<TransactionWithCategory | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Undo delete state
    const [undoBanner, setUndoBanner] = useState(false);
    const [undoCountdown, setUndoCountdown] = useState(5);
    const undoTransactionRef = useRef<TransactionWithCategory | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    // Duplicate detection
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

    const { ref: loadMoreRef, inView } = useInView();

    const {
        transactions,
        categories,
        loading,
        mounted,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refresh
    } = useTransactionsData(debouncedSearchQuery) as {
        transactions: TransactionWithCategory[];
        categories: Category[];
        loading: boolean;
        mounted: boolean;
        fetchNextPage: () => void;
        hasNextPage: boolean;
        isFetchingNextPage: boolean;
        refresh: () => Promise<void>;
    };

    const clearUndoTimers = useCallback(() => {
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }
        if (undoIntervalRef.current) {
            clearInterval(undoIntervalRef.current);
            undoIntervalRef.current = null;
        }
    }, []);

    const dismissUndo = useCallback(() => {
        clearUndoTimers();
        setUndoBanner(false);
        undoTransactionRef.current = null;
    }, [clearUndoTimers]);

    const handleUndo = useCallback(async () => {
        const txn = undoTransactionRef.current;
        if (!txn) return;

        clearUndoTimers();
        setIsRestoring(true);

        try {
            const response = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: txn.amount,
                    description: txn.description,
                    merchantName: txn.merchantName,
                    categoryId: txn.categoryId,
                    type: txn.type,
                    paymentMethod: txn.paymentMethod || "cash",
                    accountId: txn.accountId,
                    date: txn.createdAt,
                }),
            });

            if (response.ok) {
                toast.success("Transaksi dikembalikan");
                refresh();
            } else {
                toast.error("Gagal mengembalikan", "Coba lagi nanti");
            }
        } catch (error) {
            console.error("Error restoring transaction:", error);
            toast.error("Gagal mengembalikan", "Terjadi kesalahan");
        } finally {
            setIsRestoring(false);
            setUndoBanner(false);
            undoTransactionRef.current = null;
        }
    }, [clearUndoTimers, toast, refresh]);

    // Cleanup undo timers on unmount
    useEffect(() => {
        return () => clearUndoTimers();
    }, [clearUndoTimers]);

    useEffect(() => {
        if (inView && !loading && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, loading, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Derived values with useMemo for performance and stability
    const filteredTransactions = useMemo(() => {
        const result = transactions.filter(t => {
            const matchesCategory = filterCategory === "all" || Number(t.categoryId) === filterCategory;
            const matchesType = filterType === "all" || t.type === filterType;

            // Date range filter
            let matchesDate = true;
            if (dateRange) {
                const transDate = new Date(t.createdAt);
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = transDate >= startDate && transDate <= endDate;
            }

            // Amount range filter
            let matchesAmount = true;
            if (amountRange) {
                matchesAmount = t.amount >= amountRange.min && t.amount <= amountRange.max;
            }

            return matchesCategory && matchesType && matchesDate && matchesAmount;
        });

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "date") {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
            } else if (sortBy === "amount") {
                return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
            } else if (sortBy === "category") {
                const catA = a.categoryName || "";
                const catB = b.categoryName || "";
                return sortOrder === "desc" ? catB.localeCompare(catA) : catA.localeCompare(catB);
            }
            return 0;
        });

        return result;
    }, [transactions, filterCategory, filterType, dateRange, amountRange, sortBy, sortOrder]);

    // Duplicate detection: same amount + same category + same day
    const duplicateIds = useMemo(() => {
        const ids = new Set<number>();
        const seen = new Map<string, number[]>();

        for (const t of transactions) {
            const dateKey = new Date(t.createdAt)
                .toISOString().slice(0, 10);
            const key = `${t.amount}-${t.categoryId}-${dateKey}`;
            const group = seen.get(key);
            if (group) {
                group.push(t.id);
            } else {
                seen.set(key, [t.id]);
            }
        }

        for (const group of seen.values()) {
            if (group.length > 1) {
                group.forEach(id => ids.add(id));
            }
        }

        return ids;
    }, [transactions]);

    const duplicateCount = duplicateIds.size;

    // Apply duplicate filter on top of existing filtered transactions
    const displayTransactions = useMemo(() => {
        if (!showDuplicatesOnly) return filteredTransactions;
        return filteredTransactions.filter(t => duplicateIds.has(t.id));
    }, [filteredTransactions, showDuplicatesOnly, duplicateIds]);

    const groupedTransactions = useMemo(() => {
        return displayTransactions.reduce((groups: Record<string, TransactionWithCategory[]>, transaction: TransactionWithCategory) => {
            try {
                const dateObj = new Date(transaction.createdAt);
                const date = isNaN(dateObj.getTime())
                    ? (locale === "id" ? "Tanggal Tidak Valid" : "Invalid Date")
                    : format(dateObj, "dd MMM yyyy", { locale: locale === "id" ? idLocale : enUS });

                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(transaction);
            } catch (e) {
                const fallbackDate = "Lainnya";
                if (!groups[fallbackDate]) groups[fallbackDate] = [];
                groups[fallbackDate].push(transaction);
            }
            return groups;
        }, {} as Record<string, TransactionWithCategory[]>);
    }, [displayTransactions]);

    function handleDelete(id: number) {
        setConfirmDeleteId(id);
    }

    async function executeDelete(id: number) {
        setDeletingId(id);

        // Find and store the transaction before deleting
        const deletedTxn = transactions.find(t => t.id === id) || null;

        try {
            const response = await apiFetch(`/api/transactions/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                refresh();

                // Show undo banner instead of simple toast
                if (deletedTxn) {
                    // Clear any existing undo timers
                    clearUndoTimers();
                    undoTransactionRef.current = deletedTxn;
                    setUndoCountdown(5);
                    setUndoBanner(true);

                    // Countdown interval
                    undoIntervalRef.current = setInterval(() => {
                        setUndoCountdown(prev => {
                            if (prev <= 1) return 0;
                            return prev - 1;
                        });
                    }, 1000);

                    // Auto-dismiss after 5 seconds
                    undoTimerRef.current = setTimeout(() => {
                        dismissUndo();
                    }, 5000);
                } else {
                    toast.success("Transaksi dihapus");
                }
            } else {
                toast.error("Gagal menghapus", "Coba lagi nanti");
            }
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Gagal menghapus", "Terjadi kesalahan");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    }

    // Bulk actions
    function toggleSelectAll() {
        if (selectedIds.size === filteredTransactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
        }
    }

    function toggleSelect(id: number) {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    }

    async function bulkDelete() {
        if (!confirm(`Hapus ${selectedIds.size} transaksi?`)) return;

        setDeletingId(-1); // Indicate bulk delete
        try {
            const ids = Array.from(selectedIds);
            await Promise.all(
                ids.map(id =>
                    apiFetch(`/api/transactions/${id}`, { method: "DELETE" })
                )
            );
            refresh();
            toast.success(`${ids.length} transaksi dihapus`);
            setSelectedIds(new Set());
            setShowBulkActions(false);
        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error("Gagal menghapus", "Terjadi kesalahan");
        } finally {
            setDeletingId(null);
        }
    }

    async function bulkExport() {
        const ids = Array.from(selectedIds);
        const params = new URLSearchParams();
        ids.forEach(id => params.append("ids", id.toString()));

        const a = document.createElement("a");
        a.href = `/api/transactions/export/csv?${params.toString()}`;
        a.download = "monev_transaksi_selected.csv";
        a.click();
        toast.success(`${ids.length} transaksi diexport`);
    }

    function handleEdit(transaction: TransactionWithCategory) {
        setEditingTransaction(transaction);
        setIsEditModalOpen(true);
    }

    function handleEditSuccess() {
        refresh();
        setIsEditModalOpen(false);
        setEditingTransaction(null);
        toast.success("Transaksi diperbarui");
    }

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

    function handleExportCSV() {
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
        toast.success("CSV berhasil diunduh");
    }

    function handleExportPDF() {
        setShowExportMenu(false);
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
    }

    return (
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-foreground tracking-tight">{t("transactions.title")}</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                                {searchQuery ? t("transactions.searchResults") : t("transactions.allTransactions")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Sort Button */}
                        <TransactionSortMenu
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            showSortMenu={showSortMenu}
                            setShowSortMenu={setShowSortMenu}
                        />

                        {/* Bulk Select Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setShowBulkActions(!showBulkActions);
                                if (showBulkActions) setSelectedIds(new Set());
                            }}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                showBulkActions
                                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                            title="Pilih banyak"
                        >
                            {showBulkActions ? <CheckSquare size={20} /> : <Square size={20} />}
                        </motion.button>

                        {/* Export Dropdown */}
                        <div className="relative" ref={exportMenuRef}>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    showExportMenu
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                                )}
                                title="Export"
                            >
                                <Download size={20} />
                            </motion.button>
                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[200]"
                                    >
                                        <button
                                            onClick={handleExportCSV}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                        >
                                            <FileSpreadsheet size={18} className="text-emerald-500" />
                                            Export CSV
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800" />
                                        <button
                                            onClick={handleExportPDF}
                                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <FileText size={18} className="text-red-500" />
                                            Export PDF
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsImportModalOpen(true)}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                            title="Import CSV"
                        >
                            <Upload size={20} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsFilterModalOpen(true)}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                (filterCategory !== "all" || filterType !== "all" || dateRange || amountRange)
                                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400"
                            )}
                        >
                            <Filter size={20} />
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            <div className="px-6">
                <div className="relative mb-4 mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder={t("transactions.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-modern pl-11 pr-4 py-3.5 w-full shadow-sm"
                    />
                </div>

                {/* Active Filters Display */}
                {(dateRange || amountRange) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex flex-wrap gap-2 mb-4"
                    >
                        {dateRange && (
                            <button
                                onClick={() => setDateRange(null)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                            >
                                <Calendar size={12} />
                                {format(new Date(dateRange.start), "dd/MM")} - {format(new Date(dateRange.end), "dd/MM")}
                                <X size={12} />
                            </button>
                        )}
                        {amountRange && (
                            <button
                                onClick={() => setAmountRange(null)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                            >
                                Rp {amountRange.min.toLocaleString("id-ID")} - {amountRange.max.toLocaleString("id-ID")}
                                <X size={12} />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setDateRange(null);
                                setAmountRange(null);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                            Clear all
                        </button>
                    </motion.div>
                )}
                {/* Duplicate Detection Banner */}
                <AnimatePresence>
                    {!loading && duplicateCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4"
                        >
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl",
                                "bg-amber-50 dark:bg-amber-900/20",
                                "border border-amber-200 dark:border-amber-800/50"
                            )}>
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <p className="flex-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    Ditemukan {duplicateCount} transaksi yang mungkin duplikat
                                </p>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                                        showDuplicatesOnly
                                            ? "bg-amber-500 text-white"
                                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                                    )}
                                >
                                    <Eye size={14} />
                                    {showDuplicatesOnly ? "Semua" : "Lihat"}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between mb-4"
                >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {showDuplicatesOnly
                            ? "Transaksi Duplikat"
                            : searchQuery ? t("transactions.searchResults") : t("transactions.allTransactions")}
                    </p>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        {loading ? "..." : `${displayTransactions.length} ${t("transactions.count")}`}
                    </span>
                </motion.div>

                {
                    loading ? (
                        <TransactionListSkeleton count={5} />
                    ) : displayTransactions.length === 0 ? (
                        searchQuery ? (
                            <NoSearchResultsEmpty query={searchQuery} />
                        ) : (
                            <NoTransactionsEmpty />
                        )
                    ) : (
                        <>
                            <motion.div
                                key={`list-${filterCategory}-${filterType}-${searchQuery}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-6"
                            >
                                {(Object.entries(groupedTransactions) as [string, TransactionWithCategory[]][]).map(([date, dayTransactions]) => (
                                    <div key={date}>
                                        <h3 className="text-xs font-bold text-muted-foreground mb-3 py-1 px-2 uppercase tracking-widest">
                                            {date}
                                        </h3>
                                        <div className="space-y-3">

                                            {dayTransactions.map((t) => (
                                                <motion.div
                                                    key={t.id}
                                                    variants={itemVariants}
                                                    className={cn(
                                                        "group",
                                                        showDuplicatesOnly && duplicateIds.has(t.id)
                                                            && "ring-2 ring-amber-400/60 rounded-2xl"
                                                    )}
                                                >
                                                    <TransactionItem
                                                        transaction={t}
                                                        showCheckbox={showBulkActions}
                                                        isSelected={selectedIds.has(t.id)}
                                                        onSelect={toggleSelect}
                                                        onClick={() => {
                                                            if (!showBulkActions) {
                                                                setDetailTransaction(t);
                                                            }
                                                        }}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Sentinel for infinite scroll */}
                            <div ref={loadMoreRef} className="h-10" />
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="animate-spin text-muted-foreground" size={24} />
                                </div>
                            )}
                            {!hasNextPage && transactions.length > 0 && (
                                <p className="text-center text-xs text-muted-foreground py-4">
                                    Semua transaksi sudah ditampilkan
                                </p>
                            )}
                        </>
                    )
                }
            </div>

            {/* Bulk Action Bar */}
            {showBulkActions && selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedIds={selectedIds}
                    filteredTransactionsLength={filteredTransactions.length}
                    toggleSelectAll={toggleSelectAll}
                    bulkExport={bulkExport}
                    bulkDelete={bulkDelete}
                    deletingId={deletingId}
                />
            )}

            <TransactionFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filterType={filterType}
                setFilterType={setFilterType}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                categories={categories}
                dateRange={dateRange}
                setDateRange={setDateRange}
                amountRange={amountRange}
                setAmountRange={setAmountRange}
            />

            {/* Detail Modal */}
            < TransactionDetailModal
                isOpen={!!detailTransaction
                }
                onClose={() => setDetailTransaction(null)}
                transaction={detailTransaction}
                onEdit={(t) => {
                    setDetailTransaction(null);
                    setEditingTransaction(t);
                    setIsEditModalOpen(true);
                }}
                onDelete={(id) => {
                    handleDelete(id);
                    setDetailTransaction(null);
                }}
            />

            {/* Edit Transaction Modal */}
            <EditTransactionForm
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingTransaction(null);
                }}
                onSuccess={handleEditSuccess}
                transaction={editingTransaction}
            />

            {/* CSV Import Modal */}
            <Portal>
                <AnimatePresence>
                    {isImportModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsImportModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed inset-x-4 top-[10%] bottom-[10%] bg-white dark:bg-slate-900 rounded-[2.5rem] z-[999999] shadow-2xl mx-auto max-w-[500px] overflow-hidden"
                            >
                                <CSVImportWizard
                                    onClose={() => setIsImportModalOpen(false)}
                                    onSuccess={() => {
                                        refresh();
                                        setIsImportModalOpen(false);
                                    }}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
                title="Hapus Transaksi"
                description="Transaksi ini akan dihapus secara permanen. Anda yakin?"
                loading={!!deletingId}
            />

            {/* Undo Delete Banner */}
            <AnimatePresence>
                {undoBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: 80 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 80 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }}
                        className="fixed bottom-24 left-4 right-4 z-[9999] max-w-[500px] mx-auto"
                    >
                        <div className={cn(
                            "bg-slate-900 dark:bg-slate-800",
                            "rounded-2xl shadow-2xl",
                            "border border-slate-700/50",
                            "px-4 py-3.5",
                            "flex items-center gap-3"
                        )}>
                            {/* Progress ring */}
                            <div className="relative w-9 h-9 flex-shrink-0">
                                <svg
                                    className="w-9 h-9 -rotate-90"
                                    viewBox="0 0 36 36"
                                >
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="text-slate-700"
                                    />
                                    <motion.circle
                                        cx="18"
                                        cy="18"
                                        r="15"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        className="text-amber-400"
                                        strokeDasharray={2 * Math.PI * 15}
                                        initial={{
                                            strokeDashoffset: 0
                                        }}
                                        animate={{
                                            strokeDashoffset:
                                                2 * Math.PI * 15
                                        }}
                                        transition={{
                                            duration: 5,
                                            ease: "linear"
                                        }}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                    {undoCountdown}
                                </span>
                            </div>

                            {/* Message */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    Transaksi dihapus
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                    {undoTransactionRef.current?.description
                                        || "Transaksi"}
                                    {" \u2022 "}
                                    {formatCurrency(
                                        undoTransactionRef.current
                                            ?.amount ?? 0
                                    )}
                                </p>
                            </div>

                            {/* Undo button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleUndo}
                                disabled={isRestoring}
                                className={cn(
                                    "flex items-center gap-1.5",
                                    "px-4 py-2 rounded-xl",
                                    "text-sm font-bold",
                                    "transition-colors",
                                    isRestoring
                                        ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                        : "bg-amber-500 text-slate-900 hover:bg-amber-400 active:bg-amber-600"
                                )}
                            >
                                {isRestoring ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Undo2 size={16} />
                                )}
                                Batalkan
                            </motion.button>

                            {/* Dismiss */}
                            <button
                                onClick={dismissUndo}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
