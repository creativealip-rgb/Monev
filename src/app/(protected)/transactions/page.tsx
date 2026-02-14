"use client";

import { useState, useEffect, useMemo } from "react";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { EditTransactionForm } from "@/frontend/components/EditTransactionForm";
import { TransactionDetailModal } from "@/frontend/components/DetailModalsVerified";
import { Filter, Search, ChevronLeft, X, Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Transaction } from "@/types";
import { createPortal } from "react-dom";

// Portal helper to render outside the main layout container
function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

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
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<number | "all">("all");
    const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Derived values with useMemo for performance and stability
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.category || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === "all" || t.categoryId === filterCategory;
            const matchesType = filterType === "all" || t.type === filterType;

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [transactions, searchQuery, filterCategory, filterType]);

    const groupedTransactions = useMemo(() => {
        return filteredTransactions.reduce((groups: Record<string, Transaction[]>, transaction: Transaction) => {
            try {
                const dateObj = new Date(transaction.created_at);
                const date = isNaN(dateObj.getTime())
                    ? "Tanggal Tidak Valid"
                    : format(dateObj, "dd MMM yyyy");

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
        }, {} as Record<string, Transaction[]>);
    }, [filteredTransactions]);

    useEffect(() => {
        loadData();

        // Listen for transaction added event
        const handleTransactionAdded = () => {
            loadData();
        };
        window.addEventListener("transactionAdded", handleTransactionAdded);

        return () => {
            window.removeEventListener("transactionAdded", handleTransactionAdded);
        };
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            // Fetch transactions
            const transResponse = await fetch("/api/transactions");
            const transResult = await transResponse.json();

            // Fetch categories for mapping
            const catsResponse = await fetch("/api/categories");
            const catsResult = await catsResponse.json();

            if (transResult.success && catsResult.success) {
                const cats: Category[] = catsResult.data;
                setCategories(cats);

                // Map transactions with category names
                const mappedTransactions = transResult.data.map((t: {
                    id: number;
                    amount: number;
                    description: string;
                    categoryId: number;
                    type: "expense" | "income";
                    date: string;
                    isVerified: boolean;
                }) => ({
                    id: t.id.toString(),
                    amount: t.amount,
                    description: t.description,
                    category: cats.find((c: Category) => c.id === t.categoryId)?.name || "Lainnya",
                    categoryId: t.categoryId,
                    type: t.type,
                    created_at: t.date,
                    is_verified: t.isVerified,
                }));

                setTransactions(mappedTransactions);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Yakin mau hapus transaksi ini?")) return;

        setDeletingId(id);
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setTransactions(transactions.filter(t => t.id !== id));
            } else {
                alert("Gagal menghapus transaksi");
            }
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Gagal menghapus transaksi");
        } finally {
            setDeletingId(null);
        }
    }

    function handleEdit(transaction: Transaction) {
        setEditingTransaction(transaction);
        setIsEditModalOpen(true);
    }

    function handleEditSuccess() {
        loadData(); // Reload data after edit
        setIsEditModalOpen(false);
        setEditingTransaction(null);
    }

    // Skeleton loading component
    const SkeletonLoader = () => (
        <div className="space-y-6 animate-pulse">
            {/* Date skeleton */}
            <div>
                <div className="h-3 w-24 bg-slate-200 rounded-full mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-slate-100 rounded-full" />
                                    <div className="h-3 w-20 bg-slate-50 rounded-full" />
                                </div>
                                <div className="h-5 w-24 bg-slate-100 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Second date group skeleton */}
            <div>
                <div className="h-3 w-20 bg-slate-200 rounded-full mb-4" />
                <div className="space-y-3">
                    {[4, 5].map(i => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-28 bg-slate-100 rounded-full" />
                                    <div className="h-3 w-16 bg-slate-50 rounded-full" />
                                </div>
                                <div className="h-5 w-20 bg-slate-100 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ... (removed redundant logic now handled by useMemo above)

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Sticky Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-40 glass border-b border-slate-200/50 px-6 pt-12 pb-4"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsFilterModalOpen(true)}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            (filterCategory !== "all" || filterType !== "all")
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                        )}
                    >
                        <Filter size={20} />
                    </motion.button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-modern pl-11 pr-4 py-3.5 w-full"
                    />
                </div>
            </motion.header>

            {/* Content */}
            <div className="px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between mb-4"
                >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {searchQuery ? "Hasil Pencarian" : "Semua Transaksi"}
                    </p>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                        {loading ? "..." : `${filteredTransactions.length} Transaksi`}
                    </span>
                </motion.div>

                {loading ? (
                    <SkeletonLoader />
                ) : filteredTransactions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">
                            {searchQuery ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {searchQuery ? "Coba ubah kata kunci pencarian" : "Transaksi akan muncul di sini"}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={`list-${filterCategory}-${filterType}-${searchQuery}`}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {(Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([date, dayTransactions]) => (
                            <div key={date}>
                                <h3 className="text-xs font-bold text-slate-400 mb-3 sticky top-32 bg-slate-50/80 backdrop-blur-sm py-2">
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
                )}
            </div>

            {/* Filter Modal */}
            <Portal>
                <AnimatePresence>
                    {isFilterModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px]"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">Filter Transaksi</h2>
                                    <button
                                        onClick={() => setIsFilterModalOpen(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Type Filter */}
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Tipe Transaksi</p>
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
                                                            ? "bg-blue-50 border-blue-600 text-blue-600"
                                                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                                    )}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Category Filter */}
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Kategori</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setFilterCategory("all")}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                                    filterCategory === "all"
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
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
                                                            ? "bg-blue-600 border-blue-600 text-white"
                                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                                    )}
                                                >
                                                    {filterCategory === cat.id && <Check size={12} />}
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => {
                                                setFilterCategory("all");
                                                setFilterType("all");
                                            }}
                                            className="flex-1 py-4 px-6 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                                        >
                                            Reset Filter
                                        </button>
                                        <button
                                            onClick={() => setIsFilterModalOpen(false)}
                                            className="flex-[2] py-4 px-6 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
                                        >
                                            Terapkan Filter
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Detail Modal */}
            <TransactionDetailModal
                isOpen={!!detailTransaction}
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
        </div>
    );
}
