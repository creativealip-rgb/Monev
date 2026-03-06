"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { EditTransactionForm } from "@/frontend/components/EditTransactionForm";
import { TransactionDetailModal } from "@/frontend/components/DetailModalsVerified";
import { TransactionListSkeleton, NoTransactionsEmpty, NoSearchResultsEmpty, useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { Filter, Search, ArrowLeft, X, Check, Loader2, Download } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
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
import { enUS, id as idLocale } from "date-fns/locale";

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

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
    const [filterCategory, setFilterCategory] = useState<number | "all">("all");
    const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
    const [detailTransaction, setDetailTransaction] = useState<TransactionWithCategory | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const toast = useToast();

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
    } = useTransactionsData(searchQuery) as {
        transactions: TransactionWithCategory[];
        categories: Category[];
        loading: boolean;
        mounted: boolean;
        fetchNextPage: () => void;
        hasNextPage: boolean;
        isFetchingNextPage: boolean;
        refresh: () => Promise<void>;
    };

    useEffect(() => {
        if (inView && !loading && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, loading, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Derived values with useMemo for performance and stability
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesCategory = filterCategory === "all" || Number(t.categoryId) === filterCategory;
            const matchesType = filterType === "all" || t.type === filterType;
            return matchesCategory && matchesType;
        });
    }, [transactions, filterCategory, filterType]);

    const groupedTransactions = useMemo(() => {
        return filteredTransactions.reduce((groups: Record<string, TransactionWithCategory[]>, transaction: TransactionWithCategory) => {
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
    }, [filteredTransactions]);

    function handleDelete(id: number) {
        setConfirmDeleteId(id);
    }

    async function executeDelete(id: number) {
        setDeletingId(id);
        try {
            const response = await apiFetch(`/api/transactions/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                refresh();
                toast.success("Transaksi dihapus");
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
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (searchQuery) params.append("search", searchQuery);
                                if (filterCategory !== "all") params.append("categoryId", filterCategory.toString()); // Assuming API handles this later, or just simple export for now

                                const a = document.createElement("a");
                                a.href = `/api/transactions/export/csv?${params.toString()}`;
                                a.download = "monev_transaksi.csv";
                                a.click();
                            }}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                            title="Export CSV"
                        >
                            <Download size={20} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsFilterModalOpen(true)}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                (filterCategory !== "all" || filterType !== "all")
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
                <div className="relative mb-6 mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder={t("transactions.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-modern pl-11 pr-4 py-3.5 w-full shadow-sm"
                    />
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between mb-4"
                >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {searchQuery ? t("transactions.searchResults") : t("transactions.allTransactions")}
                    </p>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        {loading ? "..." : `${filteredTransactions.length} ${t("transactions.count")}`}
                    </span>
                </motion.div>

                {
                    loading ? (
                        <TransactionListSkeleton count={5} />
                    ) : filteredTransactions.length === 0 ? (
                        searchQuery ? (
                            <NoSearchResultsEmpty query={searchQuery} />
                        ) : (
                            <NoTransactionsEmpty />
                        )
                    ) : (
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
                                                className="group"
                                            >
                                                <TransactionItem
                                                    transaction={t}
                                                    onClick={() => {
                                                        setDetailTransaction(t);
                                                    }}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )
                }

                {!loading && hasNextPage && filteredTransactions.length > 0 && (
                    <div ref={loadMoreRef} className="text-center py-6 h-10 flex items-center justify-center text-muted-foreground">
                        {isFetchingNextPage ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <span className="text-xs">Scroll untuk memuat lebih banyak</span>
                        )}
                    </div>
                )}

                {loading && filteredTransactions.length > 0 && (
                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Memuat...</span>
                    </div>
                )}
            </div >

            < Portal >
                <AnimatePresence>
                    {isFilterModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px]"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-foreground">Filter Transaksi</h2>
                                    <button
                                        onClick={() => setIsFilterModalOpen(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <p className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Tipe Transaksi</p>
                                        <div className="flex gap-3">
                                            {[
                                                { id: "all", label: "Semua" },
                                                { id: "expense", label: "Pengeluaran" },
                                                { id: "income", label: "Pemasukan" }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setFilterType(type.id as any)}
                                                    className={cn(
                                                        "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all border-2",
                                                        filterType === type.id
                                                            ? "bg-sky-50 dark:bg-sky-900/50 border-sky-500 text-sky-600 dark:text-sky-400"
                                                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                                                    )}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Kategori</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setFilterCategory("all")}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                                    filterCategory === "all"
                                                        ? "bg-sky-500 border-sky-500 text-white"
                                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                                                )}
                                            >
                                                Semua
                                            </button>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setFilterCategory(cat.id)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2",
                                                        filterCategory === cat.id
                                                            ? "bg-sky-500 border-sky-500 text-white"
                                                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                                                    )}
                                                >
                                                    {filterCategory === cat.id && <Check size={12} />}
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => {
                                                setFilterCategory("all");
                                                setFilterType("all");
                                            }}
                                            className="flex-1 py-4 px-6 rounded-2xl text-sm font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                        >
                                            Reset Filter
                                        </button>
                                        <button
                                            onClick={() => setIsFilterModalOpen(false)}
                                            className="flex-[2] py-4 px-6 rounded-2xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/25 transition-all"
                                        >
                                            Terapkan Filter
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal >

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

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
                title="Hapus Transaksi"
                description="Transaksi ini akan dihapus secara permanen. Anda yakin?"
                loading={!!deletingId}
            />
        </div >
    );
}
