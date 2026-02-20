"use client";

import { useState, useEffect } from "react";
import { Plus, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { AddBudgetForm, EditBudgetForm } from "@/frontend/components/BudgetForms";
import { BudgetDetailModal } from "@/frontend/components/DetailModalsVerified";
import { BudgetCardSkeleton, NoBudgetsEmpty, useToast } from "@/frontend/components/UI";
import { Budget } from "@/types";

interface Category {
    id: number;
    name: string;
    color: string;
    type: "expense" | "income";
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const categoryIcons: Record<string, string> = {
    "Makan & Minuman": "🍽️",
    "Transportasi": "🚗",
    "Hiburan": "🎮",
    "Belanja": "🛍️",
    "Kesehatan": "💚",
    "Pendidikan": "📚",
    "Tagihan": "📄",
    "Investasi": "📈",
    "Gaji": "💰",
    "Freelance": "💼",
    "Lainnya": "📦",
    "Tabungan": "🏦"
};

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const toast = useToast();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

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

            // Optimized: Fetch categories and budgets in parallel
            const [catsResponse, budgetsResponse] = await Promise.all([
                fetch("/api/categories"),
                fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
            ]);

            const [catsResult, budgetsResult] = await Promise.all([
                catsResponse.json(),
                budgetsResponse.json()
            ]);

            if (catsResult.success) {
                setCategories(catsResult.data);
            }

            if (budgetsResult.success) {
                setBudgets(budgetsResult.data);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteBudget(id: number) {
        if (!confirm("Yakin mau hapus budget ini?")) return;

        try {
            const response = await fetch(`/api/budgets/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setBudgets(budgets.filter(b => b.id !== id));
                toast.success("Budget dihapus");
            } else {
                toast.error("Gagal menghapus", "Coba lagi nanti");
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
            toast.error("Gagal menghapus", "Terjadi kesalahan");
        }
    }

    const getCategoryIcon = (category: string) => {
        return categoryIcons[category] || "📦";
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

    return (
        <div className="relative min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 px-6 pt-safe pt-5 pb-4 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-sm font-bold text-foreground tracking-tight">Anggaran Bulanan</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition-all"
                    >
                        <Plus size={18} />
                    </motion.button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-5 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-xl shadow-sky-500/20"
            >
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">Budget Bulan Ini</p>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalSpent)}</p>
                        <p className="text-white/60 text-xs tabular-nums">dari {formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold tabular-nums">{Math.round(totalPercentage)}%</p>
                        <p className="text-white/60 text-xs">terpakai</p>
                    </div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalPercentage}%` }}
                        transition={{ duration: 1 }}
                        className={cn(
                            "h-full rounded-full",
                            totalPercentage > 90 ? "bg-rose-400" :
                                totalPercentage > 75 ? "bg-amber-400" : "bg-emerald-400"
                        )}
                    />
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6 space-y-8"
            >
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                                <ShieldAlert size={16} className="text-orange-500 dark:text-orange-400" />
                            </div>
                            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Budget Bulanan</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">{budgets.length} Kategori</span>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <BudgetCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : budgets.length === 0 ? (
                        <NoBudgetsEmpty onAddNew={() => setIsBudgetModalOpen(true)} />
                    ) : (
                        <div className="space-y-4">
                            {budgets.map((b, i) => {
                                const isDanger = b.percentage > 90;
                                const isWarning = b.percentage > 75;

                                return (
                                    <motion.div
                                        key={b.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setDetailBudget(b)}
                                        className="card-clean p-5 group relative cursor-pointer hover:shadow-lg hover:shadow-sky-200/40 dark:hover:shadow-sky-900/20 transition-all"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: b.color + "20" }}
                                            >
                                                {getCategoryIcon(b.category)}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-bold text-foreground text-[13px]">{b.category}</span>
                                                <p className="text-xs text-muted-foreground tabular-nums">Limit: {formatCurrency(b.limit)}</p>
                                            </div>
                                            <div className="text-right pr-2">
                                                <span className={cn(
                                                    "font-bold text-[13px] block tabular-nums",
                                                    isDanger ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                                                )}>
                                                    {formatCurrency(b.spent)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                                    {Math.round(b.percentage)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${b.percentage}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    isDanger ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-sky-500"
                                                )}
                                            />
                                        </div>

                                        {isDanger && (
                                            <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                ⚠️ Hampir habis
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </motion.div>

            {/* Add Budget Modal */}
            <AddBudgetForm
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                onSuccess={() => {
                    loadData();
                    setIsBudgetModalOpen(false);
                    toast.success("Budget ditambahkan");
                }}
                categories={categories}
                month={currentMonth}
                year={currentYear}
            />

            {/* Detail Modal */}
            <BudgetDetailModal
                isOpen={!!detailBudget}
                onClose={() => setDetailBudget(null)}
                budget={detailBudget}
                onEdit={(b) => {
                    setDetailBudget(null);
                    setEditingBudget(b);
                }}
                onDelete={(id) => {
                    handleDeleteBudget(id);
                    setDetailBudget(null);
                }}
            />

            {/* Edit Form */}
            {editingBudget && (
                <EditBudgetForm
                    isOpen={!!editingBudget}
                    onClose={() => setEditingBudget(null)}
                    onSuccess={() => {
                        loadData();
                        setEditingBudget(null);
                        toast.success("Budget diperbarui");
                    }}
                    budget={editingBudget}
                />
            )}
        </div>
    );
}
