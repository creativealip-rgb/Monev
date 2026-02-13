"use client";

import { useState, useEffect } from "react";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { EditTransactionForm } from "@/frontend/components/EditTransactionForm";
import { TransactionDetailModal } from "@/frontend/components/DetailModalsVerified";
import { Filter, Search, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Transaction } from "@/types";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
            // Fetch transactions
            const transResponse = await fetch("/api/transactions");
            const transResult = await transResponse.json();

            // Fetch categories for mapping
            const catsResponse = await fetch("/api/categories");
            const catsResult = await catsResponse.json();

            if (transResult.success && catsResult.success) {
                const categories: Category[] = catsResult.data;

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
                    category: categories.find((c: Category) => c.id === t.categoryId)?.name || "Lainnya",
                    categoryId: t.categoryId,
                    type: t.type,
                    created_at: t.date,
                    is_verified: t.isVerified,
                }));

                setTransactions(mappedTransactions);
            }
        } catch (error) {
            console.error("Error loading data:", error);
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

    // Filter transactions based on search
    const filteredTransactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = format(new Date(transaction.created_at), "dd MMM yyyy");
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, Transaction[]>);

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
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
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
                        {filteredTransactions.length} Transaksi
                    </span>
                </motion.div>

                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-slate-500">
                            {searchQuery ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi"}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
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
