"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, ShieldAlert, ArrowLeft, Flame, X, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { AddBudgetForm, EditBudgetForm } from "@/frontend/components/BudgetForms";
import { BudgetDetailModal } from "@/frontend/components/DetailModalsVerified";
import { BudgetCardSkeleton, NoBudgetsEmpty, useToast } from "@/frontend/components/UI";
import { BudgetChart } from "./components/BudgetChart";
import { BudgetSummary } from "@/types";
import { useSession } from "next-auth/react";
import { useSecurity } from "@/components/SecurityProvider";
import { UserTier, canCreateBudget, getTierConfig } from "@/lib/tier-gate";
import { TierLimitBanner } from "@/frontend/components/TierGateOverlay";

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

const BUDGET_TEMPLATES: Array<{ id: string; name: string; description: string; icon: string; color: string; allocations: Array<{ category: string; pct: number }> }> = [
    {
        id: "503020",
        name: "50/30/20",
        description: "Kebutuhan 50%, Keinginan 30%, Tabungan 20%",
        icon: "⚖️",
        color: "from-sky-500 to-cyan-500",
        allocations: [
            { category: "Makan & Minuman", pct: 25 },
            { category: "Transportasi", pct: 15 },
            { category: "Tagihan", pct: 10 },
            { category: "Hiburan", pct: 15 },
            { category: "Belanja", pct: 15 },
            { category: "Tabungan", pct: 20 },
        ]
    },
    {
        id: "minimalist",
        name: "Minimalist",
        description: "Hemat maksimal, spending minimal",
        icon: "🧘",
        color: "from-emerald-500 to-teal-500",
        allocations: [
            { category: "Makan & Minuman", pct: 40 },
            { category: "Transportasi", pct: 15 },
            { category: "Tagihan", pct: 15 },
            { category: "Tabungan", pct: 30 },
        ]
    },
    {
        id: "aggressive",
        name: "Aggressive Saver",
        description: "Tabungan & investasi prioritas",
        icon: "🚀",
        color: "from-amber-500 to-orange-500",
        allocations: [
            { category: "Makan & Minuman", pct: 30 },
            { category: "Transportasi", pct: 10 },
            { category: "Tagihan", pct: 10 },
            { category: "Hiburan", pct: 5 },
            { category: "Tabungan", pct: 45 },
        ]
    }
];

function getSpendingVelocity(spent: number, limit: number): { projectedDate: string | null; dailyRate: number; daysLeft: number } {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const dailyRate = dayOfMonth > 0 ? spent / dayOfMonth : 0;
    const remaining = limit - spent;
    if (dailyRate <= 0 || remaining <= 0) return { projectedDate: null, dailyRate, daysLeft };
    const daysUntilDepleted = Math.ceil(remaining / dailyRate);
    const projectedDate = new Date(today);
    projectedDate.setDate(today.getDate() + daysUntilDepleted);
    if (projectedDate.getMonth() === today.getMonth()) {
        return { projectedDate: projectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), dailyRate, daysLeft };
    }
    return { projectedDate: null, dailyRate, daysLeft };
}

export default function BudgetsPage() {
    const [showTemplates, setShowTemplates] = useState(false);
    const [incomeEstimate, setIncomeEstimate] = useState("");
    const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
    const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [detailBudget, setDetailBudget] = useState<BudgetSummary | null>(null);
    const [editingBudget, setEditingBudget] = useState<BudgetSummary | null>(null);
    const { isStealthMode } = useSecurity();
    const toast = useToast();
    const { data: session } = useSession();
    // @ts-ignore
    const userTier = (session?.user?.tier as UserTier) || "miskin";
    const tierConfig = getTierConfig(userTier);

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
                apiFetch("/api/categories"),
                apiFetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
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
            const response = await apiFetch(`/api/budgets/${id}`, {
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

    async function handleApplyTemplate(templateId: string) {
        const template = BUDGET_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        const monthlyIncome = parseFloat(incomeEstimate.replace(/\D/g, "")) || 5000000;
        setApplyingTemplate(templateId);

        try {
            const response = await apiFetch("/api/budgets/template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template: templateId === "503020" ? "50-30-20" : templateId,
                    monthlyIncome,
                    month: currentMonth,
                    year: currentYear
                }),
            });

            const result = await response.json();

            if (result.success) {
                await loadData();
                setShowTemplates(false);
                toast.success("Template diterapkan!", `Budget ${template.name} berhasil dibuat`);
            } else {
                toast.error(result.error || "Gagal menerapkan template");
            }
        } catch (e) {
            toast.error("Gagal menerapkan template");
        } finally {
            setApplyingTemplate(null);
        }
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
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Anggaran Bulanan</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Kelola Pengeluaran Anda</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!canCreateBudget(budgets.length, userTier)) {
                                toast.error("Batas Tercapai", `Tier ${tierConfig.name} hanya bisa ${tierConfig.maxBudgets} anggaran. Upgrade untuk menambah!`);
                                return;
                            }
                            setIsBudgetModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
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
                        <p className="text-2xl font-bold tabular-nums">{isStealthMode ? "******" : formatCurrency(totalSpent)}</p>
                        <p className="text-white/60 text-xs tabular-nums">terpakai dari {isStealthMode ? "******" : formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold tabular-nums">{Math.round(totalPercentage)}%</p>
                        <p className="text-white/60 text-xs">limit</p>
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

                {/* Projected Warning */}
                {(() => {
                    const today = new Date();
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const dayOfMonth = today.getDate();
                    const totalProjected = dayOfMonth > 0 ? (totalSpent / dayOfMonth) * daysInMonth : 0;
                    const income = parseFloat(incomeEstimate.replace(/\D/g, "")) || 0;

                    if (totalProjected > totalBudget && totalBudget > 0) {
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 p-3 bg-white/20 backdrop-blur-md rounded-xl flex items-center gap-3 border border-white/30"
                            >
                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
                                    <TrendingUp size={16} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold">Waspada! Proyeksi belanja melebihi budget.</p>
                                    <p className="text-[10px] text-white/80">Estimasi total: {formatCurrency(totalProjected)}</p>
                                </div>
                            </motion.div>
                        );
                    }
                    return null;
                })()}
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

                    {/* Chart Section */}
                    {budgets.length > 0 && (
                        <div className="mb-6 card-clean p-4">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Budget vs Pengeluaran Aktual</h3>
                            <BudgetChart budgets={budgets} />
                        </div>
                    )}

                    {/* Template Button & Section */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800 text-sm font-semibold text-sky-700 dark:text-sky-300 hover:from-sky-100 dark:hover:from-sky-900/40 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Zap size={16} />
                                Gunakan Template Budget
                            </div>
                            <span className="text-xs">{showTemplates ? "✕" : "→"}</span>
                        </button>

                        <AnimatePresence>
                            {showTemplates && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3 p-4 card-clean">
                                        <p className="text-xs text-muted-foreground mb-3">Estimasi penghasilan bulanan kamu:</p>
                                        <input
                                            type="text"
                                            placeholder="Rp 5.000.000"
                                            value={incomeEstimate}
                                            onChange={e => setIncomeEstimate(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                        <div className="space-y-3">
                                            {BUDGET_TEMPLATES.map(tpl => (
                                                <motion.button
                                                    key={tpl.id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleApplyTemplate(tpl.id)}
                                                    disabled={applyingTemplate !== null}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r text-white text-left transition-all",
                                                        tpl.color,
                                                        applyingTemplate === tpl.id && "opacity-60"
                                                    )}
                                                >
                                                    <span className="text-2xl">{tpl.icon}</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm">{tpl.name}</p>
                                                        <p className="text-xs text-white/80">{tpl.description}</p>
                                                    </div>
                                                    {applyingTemplate === tpl.id && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                                <p className="text-xs text-muted-foreground tabular-nums">Limit: {isStealthMode ? "******" : formatCurrency(b.limit)}</p>
                                            </div>
                                            <div className="text-right pr-2">
                                                <span className={cn(
                                                    "font-bold text-[13px] block tabular-nums",
                                                    isDanger ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                                                )}>
                                                    {isStealthMode ? "******" : formatCurrency(b.spent)}
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

                                        {/* Spending Velocity */}
                                        {(() => {
                                            const velocity = getSpendingVelocity(b.spent, b.limit);
                                            if (velocity.projectedDate) {
                                                return (
                                                    <div className="mt-2 flex items-center gap-1.5">
                                                        <Flame size={12} className="text-orange-500" />
                                                        <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                                            Estimasi habis {velocity.projectedDate} (Rp{Math.round(velocity.dailyRate / 1000)}k/hari)
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            if (isDanger) {
                                                return (
                                                    <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                        ⚠️ Hampir habis
                                                    </p>
                                                );
                                            }
                                            return null;
                                        })()}
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
