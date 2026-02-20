"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { AddGoalForm, EditGoalForm } from "@/frontend/components/BudgetForms";
import { GoalDetailModal } from "@/frontend/components/DetailModalsVerified";
import { GoalCardSkeleton, NoGoalsEmpty, useToast } from "@/frontend/components/UI";
import { Goal } from "@/types";

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

export default function SavingsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const toast = useToast();

    useEffect(() => {
        loadData();

        // Listen for transaction added event (as adding to goal creates a transaction)
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

            // Fetch categories for reference
            const catsResponse = await fetch("/api/categories");
            const catsResult = await catsResponse.json();
            if (catsResult.success) {
                setCategories(catsResult.data);
            }

            // Fetch goals
            const goalsResponse = await fetch("/api/goals");
            const goalsResult = await goalsResponse.json();

            if (goalsResult.success) {
                setGoals(goalsResult.data);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteGoal(id: number) {
        if (!confirm("Yakin mau hapus goal ini?")) return;

        try {
            const response = await fetch(`/api/goals/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setGoals(goals.filter(g => g.id !== id));
                toast.success("Goal dihapus");
            } else {
                toast.error("Gagal menghapus", "Coba lagi nanti");
            }
        } catch (error) {
            console.error("Error deleting goal:", error);
            toast.error("Gagal menghapus", "Terjadi kesalahan");
        }
    }

    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
    const totalPercentage = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

    return (
        <div className="relative min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 px-6 pt-safe pb-4 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-sm font-bold text-foreground tracking-tight">Tabungan & Goals</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsGoalModalOpen(true)}
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
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">Total Tabungan</p>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalSaved)}</p>
                        <p className="text-white/60 text-xs tabular-nums">dari {goals.length} goals</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold tabular-nums">{Math.round(totalPercentage)}%</p>
                        <p className="text-white/60 text-xs">tercapai</p>
                    </div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalPercentage}%` }}
                        transition={{ duration: 1 }}
                        className={cn(
                            "h-full rounded-full",
                            totalPercentage > 90 ? "bg-emerald-400" :
                                totalPercentage > 75 ? "bg-emerald-400" : "bg-emerald-400"
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
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                <Target size={16} className="text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Daftar Impian</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">{goals.length} Goals</span>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <GoalCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : goals.length === 0 ? (
                        <NoGoalsEmpty onAddNew={() => setIsGoalModalOpen(true)} />
                    ) : (
                        <div className="space-y-4">
                            {goals.map((g, i) => {
                                const isCompleted = g.percentage >= 100;
                                const isNearComplete = g.percentage >= 75;

                                return (
                                    <motion.div
                                        key={g.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setDetailGoal(g)}
                                        className="card-clean p-5 group relative cursor-pointer hover:shadow-lg hover:shadow-emerald-200/40 dark:hover:shadow-emerald-900/20 transition-all"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: g.color + "20" }}
                                            >
                                                <span style={{ color: g.color }}>{g.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-bold text-foreground text-[13px]">{g.name}</span>
                                                <p className="text-xs text-muted-foreground tabular-nums">Target: {formatCurrency(g.target)}</p>
                                            </div>
                                            <div className="text-right pr-2">
                                                <span className={cn(
                                                    "font-bold text-[13px] block tabular-nums",
                                                    isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                                                )}>
                                                    {formatCurrency(g.saved)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                                    {Math.round(g.percentage)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${g.percentage}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    isCompleted ? "bg-emerald-500" : isNearComplete ? "bg-sky-500" : "bg-sky-500"
                                                )}
                                            />
                                        </div>

                                        {g.deadline && (
                                            <p className="text-[10px] font-semibold text-muted-foreground mt-2 flex items-center gap-1">
                                                Deadline: {new Date(g.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                            </p>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 mb-8"
            >
                <div className="bg-slate-900/80 dark:bg-slate-800 backdrop-blur-md border border-white/10 dark:border-slate-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-sky-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-sky-400">Tips Nabung</h4>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-slate-300 dark:text-slate-400">
                            &ldquo;Menyisihkan uang di awal bulan lebih efektif daripada menabung sisa pengeluaran di akhir bulan.&rdquo;
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Add Goal Modal */}
            <AddGoalForm
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSuccess={() => {
                    loadData();
                    setIsGoalModalOpen(false);
                    toast.success("Goal dibuat", "Mulai menabung sekarang!");
                }}
            />

            {/* Detail Modal */}
            <GoalDetailModal
                isOpen={!!detailGoal}
                onClose={() => setDetailGoal(null)}
                goal={detailGoal}
                onEdit={(g) => {
                    setDetailGoal(null);
                    setEditingGoal(g);
                }}
                onDelete={(id) => {
                    handleDeleteGoal(id);
                    setDetailGoal(null);
                }}
            />

            {/* Edit Form */}
            {editingGoal && (
                <EditGoalForm
                    isOpen={!!editingGoal}
                    onClose={() => setEditingGoal(null)}
                    onSuccess={() => {
                        loadData();
                        setEditingGoal(null);
                        toast.success("Goal diperbarui");
                    }}
                    goal={editingGoal}
                />
            )}
        </div>
    );
}
