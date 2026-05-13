"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Plus, TrendingUp, ArrowLeft, Target, Check, AlertTriangle,
    Shield, Plane, Heart, Smartphone, GraduationCap, Sparkles, Zap, X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { AddGoalForm, EditGoalForm, GoalTemplateData } from "@/frontend/components/GoalForms";
import { GoalDetailModal } from "@/frontend/components/modals/GoalDetailModal";
import { ErrorEmpty, GoalCardSkeleton, NoGoalsEmpty, useToast } from "@/frontend/components/UI";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { GoalWithProgress } from "@/types";
import { useSession } from "next-auth/react";
import { useSavingsData } from "@/frontend/hooks/useSavingsData";
import { useSecurity } from "@/components/SecurityProvider";
import { canCreateGoal, UserTier } from "@/lib/tier-gate";
import { useI18n } from "@/lib/i18n";

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

const MILESTONES = [25, 50, 75, 100];

const GOAL_TEMPLATES: Array<{
    id: string;
    name: string;
    icon: string;
    IconComponent: typeof Shield;
    target: number;
    color: string;
    bgColor: string;
}> = [
    {
        id: "dana-darurat",
        name: "Dana Darurat",
        icon: "Shield",
        IconComponent: Shield,
        target: 30000000,
        color: "#3b82f6",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
        id: "liburan",
        name: "Liburan",
        icon: "Plane",
        IconComponent: Plane,
        target: 15000000,
        color: "#10b981",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
        id: "nikah",
        name: "Nikah",
        icon: "Heart",
        IconComponent: Heart,
        target: 100000000,
        color: "#ec4899",
        bgColor: "bg-pink-50 dark:bg-pink-900/20",
    },
    {
        id: "gadget-baru",
        name: "Gadget Baru",
        icon: "Smartphone",
        IconComponent: Smartphone,
        target: 10000000,
        color: "#a855f7",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
        id: "pendidikan",
        name: "Pendidikan",
        icon: "GraduationCap",
        IconComponent: GraduationCap,
        target: 50000000,
        color: "#f59e0b",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
];

function calculateEta(
    currentAmount: number,
    targetAmount: number,
    createdAt: string | Date
): { etaDate: Date | null; monthlyRate: number } {
    if (currentAmount <= 0 || targetAmount <= 0) {
        return { etaDate: null, monthlyRate: 0 };
    }
    const created = new Date(createdAt);
    const now = new Date();
    const monthsElapsed = Math.max(
        (now.getFullYear() - created.getFullYear()) * 12
            + (now.getMonth() - created.getMonth()),
        1
    );
    const monthlyRate = currentAmount / monthsElapsed;
    const remaining = targetAmount - currentAmount;
    if (remaining <= 0) {
        return { etaDate: null, monthlyRate };
    }
    const monthsNeeded = Math.ceil(remaining / monthlyRate);
    const etaDate = new Date(now);
    etaDate.setMonth(etaDate.getMonth() + monthsNeeded);
    return { etaDate, monthlyRate };
}

function formatEtaDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

const CONFETTI_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b",
    "#ec4899", "#8b5cf6", "#06b6d4",
];

const confettiVariants = {
    initial: (i: number) => ({
        opacity: 1,
        x: 0,
        y: 0,
        scale: 0,
        rotate: 0,
    }),
    animate: (i: number) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        return {
            opacity: [1, 1, 0],
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 20,
            scale: [0, 1.2, 0.6],
            rotate: Math.random() * 360,
            transition: {
                duration: 1.2,
                ease: "easeOut" as const,
                delay: i * 0.03,
            },
        };
    },
};

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    return mounted ? createPortal(children, document.body) : null;
}

function ConfettiCelebration({ goalId, celebratedRef }: {
    goalId: number;
    celebratedRef: React.MutableRefObject<Set<number>>;
}) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (celebratedRef.current.has(goalId)) return;
        celebratedRef.current.add(goalId);
        setShow(true);
        const timer = setTimeout(() => setShow(false), 2000);
        return () => clearTimeout(timer);
    }, [goalId, celebratedRef]);

    if (!show) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20 flex items-center justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                    key={i}
                    custom={i}
                    variants={confettiVariants}
                    initial="initial"
                    animate="animate"
                    className={cn(
                        "absolute",
                        i % 2 === 0 ? "w-2.5 h-2.5 rounded-full" : "w-2 h-3 rounded-sm"
                    )}
                    style={{
                        backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    }}
                />
            ))}
        </div>
    );
}

export default function SavingsPage() {
    const { goals, loading, error, refresh, refetch } = useSavingsData() as {
        goals: GoalWithProgress[];
        loading: boolean;
        error: Error | null;
        refresh: () => Promise<void>;
        refetch: () => Promise<unknown>;
    };
    const { isStealthMode } = useSecurity();
    const { t } = useI18n();

    const { data: session } = useSession();
    const userTier: UserTier = session?.user?.tier || "starter";

    // Filter & Sort state
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
    const [sortBy, setSortBy] = useState<"name" | "percentage" | "deadline">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Track celebrated goals per session (show confetti only once)
    const celebratedGoalsRef = useRef<Set<number>>(new Set());

    // Modals state
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [detailGoal, setDetailGoal] = useState<GoalWithProgress | null>(null);
    const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
    const [goalInitialData, setGoalInitialData] = useState<GoalTemplateData | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [depositGoal, setDepositGoal] = useState<GoalWithProgress | null>(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositAccountId, setDepositAccountId] = useState("");
    const [depositLoading, setDepositLoading] = useState(false);
    const [accounts, setAccounts] = useState<Array<{ id: number; name: string; balance: number }>>([]);
    const toast = useToast();

    function handleTemplateClick(template: typeof GOAL_TEMPLATES[0]) {
        if (!canCreateGoal(goals.length, userTier)) {
            toast.error(
                "Limit Goal tercapai",
                "Upgrade ke Kaya atau Sultan untuk menambah lebih banyak goals!"
            );
            return;
        }
        setGoalInitialData({
            name: template.name,
            icon: template.icon,
            color: template.color,
            targetAmount: String(template.target),
        });
        setIsGoalModalOpen(true);
    }

    async function openDepositModal(goal: GoalWithProgress) {
        setDetailGoal(null);
        setDepositGoal(goal);
        setDepositAmount("");
        try {
            const response = await apiFetch("/api/accounts");
            const result = await response.json();
            if (result.success) {
                const accountList = result.data || [];
                setAccounts(accountList);
                setDepositAccountId(accountList[0]?.id ? String(accountList[0].id) : "");
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    }

    async function handleDepositGoal() {
        if (!depositGoal || depositLoading) return;

        const amount = Number(depositAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Nominal tidak valid", "Isi nominal tabungan yang benar.");
            return;
        }
        const remaining = Math.max(0, depositGoal.targetAmount - depositGoal.currentAmount);
        if (amount > remaining) {
            toast.error("Nominal terlalu besar", `Sisa target hanya ${formatCurrency(remaining)}.`);
            return;
        }

        setDepositLoading(true);
        try {
            const response = await apiFetch(`/api/goals/${depositGoal.id}/deposit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    accountId: depositAccountId ? Number(depositAccountId) : undefined,
                    description: `Tabungan ke ${depositGoal.name}`,
                }),
            });
            const result = await response.json();
            if (result.success) {
                await refresh();
                setDepositGoal(null);
                setDepositAmount("");
                toast.success("Tabungan ditambahkan", "Tercatat juga di riwayat transaksi.");
            } else {
                toast.error("Gagal menabung", result.error || "Coba lagi nanti.");
            }
        } catch (error) {
            console.error("Error depositing to goal:", error);
            toast.error("Gagal menabung", "Coba lagi nanti.");
        } finally {
            setDepositLoading(false);
        }
    }

    function handleCloseDepositModal() {
        if (!depositLoading) {
            setDepositGoal(null);
        }
    }

    async function handleDeleteGoal() {
        if (!confirmDeleteId) return;

        try {
            const response = await apiFetch(`/api/goals/${confirmDeleteId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                refresh();
                toast.success(t("savings.goalDeleted"));
            } else {
                toast.error(t("savings.failedDelete"), t("savings.tryAgainLater"));
            }
        } catch (error) {
            console.error("Error deleting goal:", error);
            toast.error(t("savings.failedDelete"), t("savings.errorOccurred"));
        } finally {
            setConfirmDeleteId(null);
        }
    }

    const totalTarget = goals.reduce((sum: number, g: GoalWithProgress) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum: number, g: GoalWithProgress) => sum + g.currentAmount, 0);
    const totalPercentage = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

    // Filter & Sort goals
    const displayGoals = goals
        .filter(goal => {
            if (filterStatus === "active") return goal.percentage < 100;
            if (filterStatus === "completed") return goal.percentage >= 100;
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === "name") {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === "percentage") {
                comparison = a.percentage - b.percentage;
            } else if (sortBy === "deadline") {
                const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
                const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
                comparison = dateA - dateB;
            }
            return sortOrder === "desc" ? -comparison : comparison;
        });

    return (
        <div className="min-h-screen pb-32 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            aria-label="Kembali ke dashboard"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Tabungan & Goals</h1>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Wujudkan Impianmu</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="all">Semua</option>
                                <option value="active">Aktif</option>
                                <option value="completed">Selesai</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="name">Nama</option>
                                <option value="percentage">Progress</option>
                                <option value="deadline">Deadline</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsGoalModalOpen(true)}
                            aria-label="Tambah goal"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                        >
                            <Plus size={24} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-lg shadow-sky-500/10 shadow-sky-500/20"
            >
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">Total Tabungan</p>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-2xl font-bold tabular-nums">
                            {isStealthMode ? "••••••••" : formatCurrency(totalSaved)}
                        </p>
                        <p className="text-white/60 text-xs tabular-nums">dari {goals.length} target</p>
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

            {/* Goal Templates Section */}
            <div className="px-6 mt-4">
                <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    aria-expanded={showTemplates}
                    aria-controls="goal-template-list"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800 text-sm font-semibold text-sky-700 dark:text-sky-300 hover:from-sky-100 dark:hover:from-sky-900/40 transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} />
                        Template Goal Cepat
                    </div>
                    <span className="text-xs">{showTemplates ? "✕" : "→"}</span>
                </button>

                <AnimatePresence>
                    {showTemplates && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            id="goal-template-list"
                            className="overflow-hidden"
                        >
                            <div className="mt-3 grid grid-cols-2 gap-2.5">
                                {GOAL_TEMPLATES.map((tpl, idx) => {
                                    const Icon = tpl.IconComponent;
                                    return (
                                        <motion.button
                                            key={tpl.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileTap={{ scale: 0.96 }}
                                            type="button"
                                            onClick={() => handleTemplateClick(tpl)}
                                            aria-label={`Gunakan template goal ${tpl.name}`}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent",
                                                "bg-white dark:bg-slate-900 shadow-sm",
                                                "hover:shadow-md hover:border-sky-200 dark:hover:border-sky-800",
                                                "transition-all text-center"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-11 h-11 rounded-xl flex items-center justify-center",
                                                    tpl.bgColor
                                                )}
                                            >
                                                <Icon
                                                    size={20}
                                                    style={{ color: tpl.color }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-foreground leading-tight">
                                                {tpl.name}
                                            </span>
                                            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                                                {formatCurrency(tpl.target)}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                             {userTier === "starter" && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <Zap size={10} className="text-slate-500" />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">1 slot tersedia</span>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">{goals.length} target</span>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <GoalCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="pb-36">
                            <ErrorEmpty
                                title="Gagal memuat tabungan"
                                description={error.message || "Periksa koneksi Anda, lalu coba muat ulang daftar goal."}
                                onRetry={() => { void refetch(); }}
                            />
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="pb-36">
                            <NoGoalsEmpty onAddNew={() => setIsGoalModalOpen(true)} />
                        </div>
                    ) : displayGoals.length === 0 ? (
                        <div className="pb-36">
                            <ErrorEmpty
                                title="Tidak ada goal yang cocok"
                                description="Ubah filter atau urutan untuk melihat goal lainnya."
                                onRetry={() => setFilterStatus("all")}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayGoals.map((g: GoalWithProgress, i: number) => {
                                const isCompleted = g.percentage >= 100;
                                const isNearComplete = g.percentage >= 75;
                                const { etaDate, monthlyRate } = calculateEta(
                                    g.currentAmount, g.targetAmount, g.createdAt
                                );
                                const hasDeadlineWarning = etaDate && g.deadline
                                    && etaDate.getTime() > new Date(g.deadline).getTime();

                                return (
                                    <motion.div
                                        key={g.id}
                                        data-testid="savings-goal-card"
                                        whileHover={{ scale: 1.02 }}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Detail goal ${g.name}, progress ${Math.round(g.percentage)} persen`}
                                        onClick={() => setDetailGoal(g)}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setDetailGoal(g); }}
                                        className={cn(
                                            "card-clean p-5 group relative cursor-pointer hover:shadow-lg hover:shadow-emerald-200/40 dark:hover:shadow-emerald-900/20 transition-all",
                                            isCompleted && "overflow-visible"
                                        )}
                                    >
                                        {/* Completed badge */}
                                        {isCompleted && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute -top-2 -right-2 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/30 z-10"
                                            >
                                                Tercapai!
                                            </motion.div>
                                        )}

                                        {/* Confetti celebration for completed goals */}
                                        {isCompleted && (
                                            <ConfettiCelebration
                                                goalId={g.id}
                                                celebratedRef={celebratedGoalsRef}
                                            />
                                        )}

                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: g.color + "20" }}
                                            >
                                                <span style={{ color: g.color }}>{g.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <span data-testid="savings-goal-name" className="font-bold text-foreground text-[13px]">{g.name}</span>
                                                <p data-testid="savings-goal-target" className="text-xs text-muted-foreground tabular-nums">
                                                    Target: {isStealthMode ? "••••••••" : formatCurrency(g.targetAmount)}
                                                </p>
                                            </div>
                                            <div className="text-right pr-2">
                                                <span data-testid="savings-goal-current" className={cn(
                                                    "font-bold text-[13px] block tabular-nums",
                                                    isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                                                )}>
                                                    {isStealthMode ? "••••••••" : formatCurrency(g.currentAmount)}
                                                </span>
                                                <span data-testid="savings-goal-progress" className="text-[10px] text-muted-foreground tabular-nums">
                                                    {Math.round(g.percentage)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress bar with milestone markers */}
                                        <div className="relative w-full mb-1">
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(g.percentage, 100)}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        isCompleted ? "bg-emerald-500" : isNearComplete ? "bg-sky-500" : "bg-sky-500"
                                                    )}
                                                />
                                            </div>
                                            {/* Milestone markers */}
                                            <div className="absolute inset-0 flex items-center pointer-events-none">
                                                {MILESTONES.map((ms) => (
                                                    <div
                                                        key={ms}
                                                        className="absolute flex flex-col items-center"
                                                        style={{ left: `${ms}%`, transform: 'translateX(-50%)' }}
                                                    >
                                                        <div className={cn(
                                                            "w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all",
                                                            g.percentage >= ms
                                                                ? "bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30"
                                                                : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                                                        )}>
                                                            {g.percentage >= ms && (
                                                                <Check size={7} className="text-white" strokeWidth={3} />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Milestone labels */}
                                        <div className="relative w-full h-3 mb-2">
                                            {MILESTONES.map((ms) => (
                                                <span
                                                    key={ms}
                                                    className={cn(
                                                        "absolute text-[8px] font-bold tabular-nums",
                                                        g.percentage >= ms
                                                            ? "text-emerald-500 dark:text-emerald-400"
                                                            : "text-slate-400 dark:text-slate-600"
                                                    )}
                                                    style={{ left: `${ms}%`, transform: 'translateX(-50%)' }}
                                                >
                                                    {ms}%
                                                </span>
                                            ))}
                                        </div>

                                        {/* Congratulatory message for completed goals */}
                                        {isCompleted && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="flex items-center gap-2 mt-1 mb-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50"
                                            >
                                                <Sparkles size={14} className="text-emerald-500 flex-shrink-0" />
                                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    Selamat! Target tercapai!
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* ETA and deadline info */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            {g.deadline && (
                                                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                                    Deadline: {new Date(g.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                                </p>
                                            )}

                                            {!isCompleted && g.currentAmount > 0 && etaDate && (
                                                <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                                    <TrendingUp size={10} />
                                                    Estimasi tercapai: {formatEtaDate(etaDate)}
                                                </p>
                                            )}

                                            {!isCompleted && g.currentAmount <= 0 && (
                                                <p className="text-[10px] font-medium text-muted-foreground italic">
                                                    Mulai menabung untuk melihat estimasi
                                                </p>
                                            )}

                                            {!isCompleted && hasDeadlineWarning && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"
                                                >
                                                    <AlertTriangle size={10} />
                                                    Perlu ditingkatkan!
                                                </motion.p>
                                            )}
                                        </div>
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
                <div className="bg-slate-900/80 dark:bg-slate-800 backdrop-blur-md border border-white/10 dark:border-slate-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-sky-500/10">
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
                isOpen={isGoalModalOpen || !!goalInitialData}
                onClose={() => { setIsGoalModalOpen(false); setGoalInitialData(null); }}
                onSuccess={() => { refresh(); setIsGoalModalOpen(false); setGoalInitialData(null); }}
                initialData={goalInitialData || undefined}
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
                    setConfirmDeleteId(id);
                    setDetailGoal(null);
                }}
                onDeposit={(g) => { void openDepositModal(g); }}
            />

            {/* Edit Form */}
            {editingGoal && (
                <EditGoalForm
                    isOpen={!!editingGoal}
                    onClose={() => setEditingGoal(null)}
                    onSuccess={() => {
                        refresh();
                        setEditingGoal(null);
                        toast.success(t("savings.goalUpdated"));
                    }}
                    goal={editingGoal}
                />
            )}

            <Portal>
                <AnimatePresence>
                    {depositGoal && (
                        <>
                            <motion.div
                                key="deposit-goal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                            onClick={handleCloseDepositModal}
                        />
                        <motion.div
                            key="deposit-goal-modal"
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="deposit-goal-title"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="deposit-goal-title" className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Tambah Tabungan</h2>
                                <button type="button" aria-label="Tutup form tambah tabungan" disabled={depositLoading} onClick={handleCloseDepositModal} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Target</p>
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">{depositGoal.name}</p>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                                    Sisa target {formatCurrency(Math.max(0, depositGoal.targetAmount - depositGoal.currentAmount))}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Nominal Tabungan</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-base font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Sumber Dana</label>
                                    <select
                                        value={depositAccountId}
                                        onChange={(e) => setDepositAccountId(e.target.value)}
                                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white"
                                    >
                                        <option value="">Tanpa mengurangi saldo akun</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name} - {formatCurrency(account.balance)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDepositGoal}
                                    disabled={depositLoading || !depositAmount || Number(depositAmount) <= 0}
                                    className={cn(
                                        "w-full py-3 rounded-xl text-sm font-bold transition-all mt-2",
                                        depositLoading || !depositAmount || Number(depositAmount) <= 0
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
                                    )}
                                >
                                    {depositLoading ? "Menyimpan..." : "Tambah & Catat Transaksi"}
                                </button>
                            </div>
                        </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDeleteGoal}
                title={t("savings.deleteTitle")}
                description={t("savings.deleteConfirm")}
                confirmText={t("savings.delete")}
            />
        </div>
    );
}
