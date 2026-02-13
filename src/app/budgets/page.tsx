"use client";

import { useState, useEffect } from "react";
import { Plus, ShieldAlert, TrendingUp, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { AddBudgetForm, AddGoalForm, EditBudgetForm, EditGoalForm } from "@/frontend/components/BudgetForms";
import { BudgetDetailModal, GoalDetailModal } from "@/frontend/components/DetailModalsVerified";
import { Budget, Goal } from "@/types";

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
};

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

    const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
    const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Initialize from localStorage directly
    const [activeTab, setActiveTab] = useState<"budgets" | "goals">(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("budgetsActiveTab");
            if (saved === "budgets" || saved === "goals") return saved;
        }
        return "budgets";
    });

    // Hydration fix: sync with localStorage after mount
    useEffect(() => {
        const saved = localStorage.getItem("budgetsActiveTab");
        if ((saved === "budgets" || saved === "goals") && saved !== activeTab) {
            setActiveTab(saved);
        }
    }, []);

    // Save to localStorage when tab changes
    useEffect(() => {
        localStorage.setItem("budgetsActiveTab", activeTab);
    }, [activeTab]);

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

            // Fetch categories first
            const catsResponse = await fetch("/api/categories");
            const catsResult = await catsResponse.json();
            if (catsResult.success) {
                setCategories(catsResult.data);
            }

            // Fetch budgets
            const budgetsResponse = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
            const budgetsResult = await budgetsResponse.json();

            if (budgetsResult.success) {
                setBudgets(budgetsResult.data);
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

    async function handleDeleteBudget(id: number) {
        if (!confirm("Yakin mau hapus budget ini?")) return;

        try {
            const response = await fetch(`/api/budgets/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setBudgets(budgets.filter(b => b.id !== id));
            } else {
                alert("Gagal menghapus budget");
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
            alert("Gagal menghapus budget");
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

    const getCategoryIcon = (category: string) => {
        return categoryIcons[category] || "📦";
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

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
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Budget & Goals</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => activeTab === "budgets" ? setIsBudgetModalOpen(true) : setIsGoalModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all"
                    >
                        <Plus size={22} />
                    </motion.button>
                </div>
                <p className="text-sm text-slate-500 ml-13">Kelola pengeluaran dan impianmu.</p>
            </motion.header>

            {/* Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-5 bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl text-white"
            >
                <p className="text-slate-300 text-xs mb-2">Budget Bulan Ini</p>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
                        <p className="text-slate-400 text-xs">dari {formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{Math.round(totalPercentage)}%</p>
                        <p className="text-slate-400 text-xs">terpakai</p>
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

            {/* Tab Navigation */}
            <div className="mx-6 mt-6 flex gap-2">
                <button
                    onClick={() => setActiveTab("budgets")}
                    className={cn(
                        "flex-1 py-3 rounded-xl font-semibold text-sm transition-all",
                        activeTab === "budgets"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                    )}
                >
                    Budget
                </button>
                <button
                    onClick={() => setActiveTab("goals")}
                    className={cn(
                        "flex-1 py-3 rounded-xl font-semibold text-sm transition-all",
                        activeTab === "goals"
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                    )}
                >
                    Goals
                </button>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6 space-y-8"
            >
                {activeTab === "budgets" ? (
                    /* Monthly Budgets */
                    <motion.section variants={itemVariants}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <ShieldAlert size={16} className="text-orange-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900">Budget Bulanan</h2>
                            </div>
                            <span className="text-xs text-slate-500">{budgets.length} Kategori</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                                <p className="text-slate-500 text-sm mt-2">Memuat data...</p>
                            </div>
                        ) : budgets.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                                <p className="text-slate-500">Belum ada budget</p>
                                <p className="text-xs text-slate-400 mt-1">Tambah budget untuk mulai tracking</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {budgets.map((b, i) => {
                                    const isDanger = b.percentage > 90;
                                    const isWarning = b.percentage > 75;

                                    return (
                                        <motion.div
                                            key={b.id}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setDetailBudget(b)} // Open detail modal
                                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group relative cursor-pointer hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                    style={{ backgroundColor: b.color + "20" }}
                                                >
                                                    {getCategoryIcon(b.category)}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-semibold text-slate-800 text-sm">{b.category}</span>
                                                    <p className="text-xs text-slate-400">Limit: {formatCurrency(b.limit)}</p>
                                                </div>
                                                <div className="text-right pr-2">
                                                    <span className={cn(
                                                        "font-bold text-sm block",
                                                        isDanger ? "text-rose-600" : "text-slate-900"
                                                    )}>
                                                        {formatCurrency(b.spent)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {Math.round(b.percentage)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${b.percentage}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        isDanger ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                />
                                            </div>

                                            {isDanger && (
                                                <p className="text-[10px] font-semibold text-rose-500 mt-2 flex items-center gap-1">
                                                    ⚠️ Hampir habis
                                                </p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.section>
                ) : (
                    /* Savings Goals */
                    <motion.section variants={itemVariants}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <TrendingUp size={16} className="text-emerald-500" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-900">Tabungan Impian</h2>
                            </div>
                            <span className="text-xs text-slate-500">{goals.length} Goals</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
                                <p className="text-slate-500">Belum ada goals</p>
                                <p className="text-xs text-slate-400 mt-1">Tambah goal untuk mulai menabung</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {goals.map((g, i) => (
                                    <motion.div
                                        key={g.id}
                                        whileHover={{ scale: 1.01 }}
                                        onClick={() => setDetailGoal(g)} // Open detail modal
                                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group relative cursor-pointer hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Icon */}
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                                style={{ backgroundColor: g.color + "15" }}
                                            >
                                                <span style={{ color: g.color }}>{g.icon}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-slate-900 text-sm truncate">{g.name}</h3>
                                                    <span className="text-sm font-bold text-slate-700">{Math.round(g.percentage)}%</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs mb-2">
                                                    <span className="font-semibold" style={{ color: g.color }}>
                                                        {formatCurrency(g.saved)}
                                                    </span>
                                                    <span className="text-slate-400">/</span>
                                                    <span className="text-slate-500">{formatCurrency(g.target)}</span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${g.percentage}%` }}
                                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: g.color }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.section>
                )}
            </motion.div>

            {/* Add Budget Modal */}
            <AddBudgetForm
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                onSuccess={() => {
                    loadData();
                    setIsBudgetModalOpen(false);
                }}
                categories={categories}
                month={currentMonth}
                year={currentYear}
            />

            {/* Add Goal Modal */}
            <AddGoalForm
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSuccess={() => {
                    loadData();
                    setIsGoalModalOpen(false);
                }}
            />

            {/* Detail Modals */}
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

            {/* Edit Forms */}
            {editingBudget && (
                <EditBudgetForm
                    isOpen={!!editingBudget}
                    onClose={() => setEditingBudget(null)}
                    onSuccess={() => {
                        loadData();
                        setEditingBudget(null);
                    }}
                    budget={editingBudget}
                />
            )}

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
