"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, ChevronLeft, PiggyBank, Target } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { AddGoalForm, EditGoalForm } from "@/frontend/components/BudgetForms";
import { GoalDetailModal } from "@/frontend/components/DetailModalsVerified";
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
            } else {
                alert("Gagal menghapus goal");
            }
        } catch (error) {
            console.error("Error deleting goal:", error);
            alert("Gagal menghapus goal");
        }
    }

    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
    const totalPercentage = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-12 pb-6 bg-white border-b border-slate-100"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tabungan & Goals</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsGoalModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all"
                    >
                        <Plus size={22} />
                    </motion.button>
                </div>
                <p className="text-sm text-slate-500 ml-13">Wujudkan impianmu pelan-pelan tapi pasti. ✨</p>
            </motion.header>

            {/* Savings Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-6 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Total Tabungan</p>
                        <p className="text-3xl font-black">{formatCurrency(totalSaved)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <PiggyBank size={24} className="text-white" />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-100 uppercase tracking-wider">Progress Impian</span>
                        <span>{Math.round(totalPercentage)}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalPercentage}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        />
                    </div>
                    <p className="text-[10px] text-emerald-100 text-center font-medium italic">
                        "Sedikit demi sedikit, lama-lama jadi bukit."
                    </p>
                </div>
            </motion.div>

            {/* Goals List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6 space-y-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Target size={16} className="text-emerald-500" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Daftar Impian</h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-widest">
                        {goals.length} Goals
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex-shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between">
                                            <div className="h-4 w-28 bg-slate-100 rounded-full" />
                                            <div className="h-4 w-10 bg-slate-100 rounded-full" />
                                        </div>
                                        <div className="flex justify-between">
                                            <div className="space-y-1">
                                                <div className="h-3 w-16 bg-slate-50 rounded-full" />
                                                <div className="h-4 w-24 bg-slate-100 rounded-full" />
                                            </div>
                                            <div className="space-y-1 flex flex-col items-end">
                                                <div className="h-3 w-12 bg-slate-50 rounded-full" />
                                                <div className="h-3 w-20 bg-slate-100 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-50 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PiggyBank size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">Belum ada goals, Bos.</p>
                        <p className="text-xs text-slate-400 mt-1 mb-6">Mulai catat apa yang ingin Bos capai!</p>
                        <button
                            onClick={() => setIsGoalModalOpen(true)}
                            className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                            + Buat Goal Pertama
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {goals.map((g, i) => (
                            <motion.div
                                key={g.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setDetailGoal(g)}
                                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon Container */}
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:rotate-12"
                                        style={{ backgroundColor: g.color + "15" }}
                                    >
                                        <span style={{ color: g.color }}>{g.icon}</span>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="font-bold text-slate-900 text-base truncate pr-2 tracking-tight">{g.name}</h3>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-slate-900">{Math.round(g.percentage)}%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Terkumpul</span>
                                                <span className="font-black text-sm" style={{ color: g.color }}>
                                                    {formatCurrency(g.saved)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Target</span>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {formatCurrency(g.target)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progressive Progress Bar */}
                                        <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${g.percentage}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                                style={{ backgroundColor: g.color }}
                                            />
                                        </div>

                                        {/* Deadline Info if exists */}
                                        {g.deadline && (
                                            <div className="mt-3 flex items-center gap-1.5 opacity-60">
                                                <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    Deadline: {new Date(g.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Quick Tips Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 mb-8"
            >
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Tips Nabung</h4>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                            "Menyisihkan uang di awal bulan lebih efektif daripada menabung sisa pengeluaran di akhir bulan."
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
                    }}
                    goal={editingGoal}
                />
            )}
        </div>
    );
}
