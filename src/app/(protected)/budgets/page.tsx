"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, ShieldAlert, ArrowLeft, Flame, Zap, TrendingUp, RotateCcw, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { AddBudgetForm, EditBudgetForm } from "@/frontend/components/BudgetForms";
import { BudgetDetailModal } from "@/frontend/components/modals/BudgetDetailModal";
import { BudgetCardSkeleton, NoBudgetsEmpty, useToast } from "@/frontend/components/UI";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";

const BudgetChart = dynamic(() => import("./components/BudgetChart").then(mod => mod.BudgetChart), {
    loading: () => <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
});
import { BudgetSummary } from "@/types";
import { useSession } from "next-auth/react";
import { useSecurity } from "@/components/SecurityProvider";
import { UserTier, canCreateBudget, getTierConfig } from "@/lib/tier-gate";
import { useI18n } from "@/lib/i18n";

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

const BUDGET_TEMPLATES: Array<{ id: string; name: string; icon: string; color: string; allocations: Array<{ category: string; pct: number }> }> = [
    {
        id: "503020",
        name: "50/30/20",
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
    const { t } = useI18n();
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
    const userTier: UserTier = session?.user?.tier || "starter";
    const tierConfig = getTierConfig(userTier);

    const [prevBudgets, setPrevBudgets] = useState<BudgetSummary[]>([]);
    const [rolloverEnabled, setRolloverEnabled] = useState<Record<number, boolean>>({});
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

    // Budget threshold toast notifications (once per session per budget per threshold)
    const notifiedBudgetsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (loading || budgets.length === 0) return;

        budgets.forEach((b) => {
            const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            const overKey = `${b.id}-over`;
            const warnKey = `${b.id}-warn`;

            if (pct >= 100 && !notifiedBudgetsRef.current.has(overKey)) {
                notifiedBudgetsRef.current.add(overKey);
                toast.error(
                    "Budget Terlampaui!",
                    `Budget ${b.category} sudah melebihi batas!`
                );
            } else if (
                pct >= 80 &&
                pct < 100 &&
                !notifiedBudgetsRef.current.has(warnKey)
            ) {
                notifiedBudgetsRef.current.add(warnKey);
                toast.warning(
                    t("budgets.budgetAlmostEmpty"),
                    `Budget ${b.category} sudah terpakai ${Math.round(pct)}%`
                );
            }
        });
    }, [loading, budgets]);

    async function loadData() {
        try {
            setLoading(true);

            // Calculate previous month/year
            const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
            const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

            // Optimized: Fetch categories, budgets, and previous month budgets in parallel
            const [catsResponse, budgetsResponse, prevBudgetsResponse] = await Promise.all([
                apiFetch("/api/categories"),
                apiFetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
                apiFetch(`/api/budgets?month=${prevMonth}&year=${prevYear}`)
            ]);

            const [catsResult, budgetsResult, prevBudgetsResult] = await Promise.all([
                catsResponse.json(),
                budgetsResponse.json(),
                prevBudgetsResponse.json()
            ]);

            if (catsResult.success) {
                setCategories(catsResult.data);
            }

            if (budgetsResult.success) {
                setBudgets(budgetsResult.data);
                // Initialize rollover state from API response
                const rolloverState: Record<number, boolean> = {};
                budgetsResult.data.forEach((b: BudgetSummary & { enableRollover?: boolean }) => {
                    rolloverState[b.id] = b.enableRollover ?? false;
                });
                setRolloverEnabled(rolloverState);
            }

            if (prevBudgetsResult.success) {
                setPrevBudgets(prevBudgetsResult.data);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteBudget() {
        if (!confirmDeleteId) return;

        try {
            const response = await apiFetch(`/api/budgets/${confirmDeleteId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setBudgets(budgets.filter(b => b.id !== confirmDeleteId));
                toast.success(t("budgets.deleteBudget"));
            } else {
                toast.error(t("common.failed"), t("budgets.failedDelete"));
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
            toast.error(t("common.failed"), t("budgets.failedDelete"));
        } finally {
            setConfirmDeleteId(null);
        }
    }

    const getCategoryIcon = (category: string) => {
        return categoryIcons[category] || "📦";
    };

    const getRolloverAmount = useCallback((budget: BudgetSummary): number => {
        const prev = prevBudgets.find(
            (pb) => pb.categoryId === budget.categoryId
        );
        if (!prev) return 0;
        const unused = prev.limit - prev.spent;
        return unused > 0 ? unused : 0;
    }, [prevBudgets]);

    const getEffectiveLimit = useCallback((budget: BudgetSummary): number => {
        if (!rolloverEnabled[budget.id]) return budget.limit;
        return budget.limit + getRolloverAmount(budget);
    }, [rolloverEnabled, getRolloverAmount]);

    const toggleRollover = useCallback(async (budgetId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newValue = !rolloverEnabled[budgetId];
        
        // Optimistically update UI
        setRolloverEnabled((prev) => ({
            ...prev,
            [budgetId]: newValue,
        }));

        // Persist to server
        try {
            const budget = budgets.find(b => b.id === budgetId);
            if (!budget) return;
            
            await apiFetch("/api/budgets/rollover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId: budget.categoryId,
                    enableRollover: newValue,
                    month: selectedMonth,
                    year: selectedYear,
                }),
            });
        } catch (error) {
            console.error("Failed to persist rollover:", error);
            // Revert on error
            setRolloverEnabled((prev) => ({
                ...prev,
                [budgetId]: !newValue,
            }));
            toast.error(t("budgets.failedSaveRollover"));
        }
    }, [rolloverEnabled, budgets, selectedMonth, selectedYear]);

    const navigateMonth = (direction: "prev" | "next") => {
        let newMonth = selectedMonth + (direction === "prev" ? -1 : 1);
        let newYear = selectedYear;

        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        } else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }

        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    const goToCurrentMonth = () => {
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
    };

    const monthNames = [
        t("budgets.january"), t("budgets.february"), t("budgets.march"), t("budgets.april"),
        t("budgets.may"), t("budgets.june"),
        t("budgets.july"), t("budgets.august"), t("budgets.september"), t("budgets.october"),
        t("budgets.november"), t("budgets.december")
    ];

    const totalBudget = budgets.reduce((sum, b) => sum + getEffectiveLimit(b), 0);
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
                    month: selectedMonth,
                    year: selectedYear
                }),
            });

            const result = await response.json();

            if (result.success) {
                await loadData();
                setShowTemplates(false);
                toast.success(t("budgets.successAdd"), `${t("budgets.50-30-20")} ${t("common.success")}`);
            } else {
                toast.error(result.error || t("budgets.errorAdd"));
            }
        } catch (e) {
            toast.error(t("budgets.errorAdd"));
        } finally {
            setApplyingTemplate(null);
        }
    }

    return (
        <div className="min-h-screen pb-56 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-2 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 pb-3 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{t("budgets.title")}</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">{t("budgets.subtitle")}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!canCreateBudget(budgets.length, userTier)) {
                                const msg = t("budgets.tierLimit")
                                    .replace("{tierName}", tierConfig.name)
                                    .replace("{maxBudgets}", String(tierConfig.maxBudgets));
                                toast.error(t("budgets.limitReached"), msg);
                                return;
                            }
                            setIsBudgetModalOpen(true);
                        }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-xl shadow-sky-500/20"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateMonth("prev")}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label={t("budgets.previousMonth")}
                        >
                            <ChevronLeft size={18} className="text-white" />
                        </button>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t("budgets.monthlyBudget")}</p>
                            <p className="text-sm font-black text-white">{monthNames[selectedMonth - 1]} {selectedYear}</p>
                        </div>
                        <button
                            onClick={() => navigateMonth("next")}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label={t("budgets.nextMonth")}
                            disabled={selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear()}
                        >
                            <ChevronLeft size={18} className="text-white rotate-180" />
                        </button>
                    </div>
                    {(selectedMonth !== new Date().getMonth() + 1 || selectedYear !== new Date().getFullYear()) && (
                        <button
                            onClick={goToCurrentMonth}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition-colors"
                        >
                            Hari Ini
                        </button>
                    )}
                </div>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-2xl font-bold tabular-nums">{isStealthMode ? "******" : formatCurrency(totalSpent)}</p>
                        <p className="text-white/60 text-xs tabular-nums">{t("budgets.used")} {isStealthMode ? "******" : formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold tabular-nums">{Math.round(totalPercentage)}%</p>
                        <p className="text-white/60 text-xs">{t("budgets.limit")}</p>
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
                                    <p className="text-[11px] font-bold">{t("budgets.projectedWarning")}</p>
                                    <p className="text-[10px] text-white/80">{t("budgets.estimatedTotal")}: {formatCurrency(totalProjected)}</p>
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
                className="p-4 sm:p-6 space-y-6 sm:space-y-8"
            >
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                                <ShieldAlert size={16} className="text-orange-500 dark:text-orange-400" />
                            </div>
                            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">{t("budgets.annual")}</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">{budgets.length} {t("budgets.categories")}</span>
                    </div>

                    {/* Chart Section */}
                    {budgets.length > 0 && (
                        <div className="mb-6 card-clean p-4">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">{t("budgets.budgetVsActual")}</h3>
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
                                    {t("budgets.useTemplate")}
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
                                        <p className="text-xs text-muted-foreground mb-3">{t("budgets.estimate")}:</p>
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
                                                        <p className="font-bold text-sm">{t(`budgets.${tpl.id}`)}</p>
                                                        <p className="text-xs text-white/80">{t(`budgets.${tpl.id}.desc`)}</p>
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
                        <div className="-mt-10 pb-40 sm:mt-0">
                            <NoBudgetsEmpty onAddNew={() => setIsBudgetModalOpen(true)} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {budgets.map((b, i) => {
                                const effectiveLimit = getEffectiveLimit(b);
                                const effectivePct = effectiveLimit > 0
                                    ? Math.min((b.spent / effectiveLimit) * 100, 100)
                                    : 0;
                                const isDanger = effectivePct > 90;
                                const isWarning = effectivePct > 75;
                                const rolloverAmt = getRolloverAmount(b);
                                const isRollover = rolloverEnabled[b.id] ?? false;

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
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    Limit: {isStealthMode ? "******" : formatCurrency(effectiveLimit)}
                                                </p>
                                            </div>
                                            <div className="text-right pr-2">
                                                <span className={cn(
                                                    "font-bold text-[13px] block tabular-nums",
                                                    isDanger ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                                                )}>
                                                    {isStealthMode ? "******" : formatCurrency(b.spent)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                                    {Math.round(effectivePct)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${effectivePct}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    isDanger ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-sky-500"
                                                )}
                                            />
                                        </div>

                                        {/* Rollover Toggle */}
                                        {rolloverAmt > 0 && (
                                            <div className="mt-3 flex items-center justify-between">
                                                <button
                                                    onClick={(e) => toggleRollover(b.id, e)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                                                        isRollover
                                                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-7 h-4 rounded-full relative transition-colors",
                                                        isRollover
                                                            ? "bg-emerald-500"
                                                            : "bg-slate-300 dark:bg-slate-600"
                                                    )}>
                                                        <div className={cn(
                                                            "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform",
                                                            isRollover ? "translate-x-3.5" : "translate-x-0.5"
                                                        )} />
                                                    </div>
                                                    <RotateCcw size={12} />
                                                    <span>Rollover sisa bulan lalu</span>
                                                </button>
                                                {isRollover && (
                                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        Sisa bulan lalu: +{isStealthMode ? "******" : formatCurrency(rolloverAmt)}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Spending Velocity */}
                                        {(() => {
                                            const velocity = getSpendingVelocity(b.spent, effectiveLimit);
                                            if (velocity.projectedDate) {
                                                return (
                                                    <div className="mt-2 flex items-center gap-1.5">
                                                        <Flame size={12} className="text-orange-500" />
                                                        <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                                            {t("budgets.estimatedDeplete")} {velocity.projectedDate} (Rp{Math.round(velocity.dailyRate / 1000)}k{t("budgets.dailyRate")})
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            if (isDanger) {
                                                return (
                                                    <p className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                        ⚠️ {t("budgets.almostDepleted")}
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
                    toast.success(t("budgets.successAdd"));
                }}
                categories={categories}
                month={selectedMonth}
                year={selectedYear}
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
                    setConfirmDeleteId(id);
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
                        toast.success(t("budgets.successUpdate"));
                    }}
                    budget={editingBudget}
                />
            )}

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDeleteBudget}
                title={t("budgets.deleteTitle")}
                description={t("budgets.deleteConfirm")}
                confirmText={t("budgets.delete")}
            />
        </div>
    );
}
