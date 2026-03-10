"use client";

import { useState, useMemo } from "react";
import { FeatureItem } from "@/frontend/components/FeatureItem";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { TransferModal } from "@/frontend/components/TransferModal";
import { TransactionListSkeleton, NoTransactionsEmpty, useToast } from "@/frontend/components/UI";
import { AddTransactionSheet } from "@/frontend/components/AddTransactionSheet";
import { DailyInsight } from "@/frontend/components/DailyInsight";
import { HealthScoreWidget } from "@/frontend/components/HealthScoreWidget";
import Image from "next/image";
import {
    Sparkles,
    PieChart,
    PiggyBank,
    Receipt,
    TrendingUp,
    Bell,
    ChevronRight,
    Wallet,
    Zap,
    Crown,
    Lock,
    AlertTriangle,
    Users,
    Repeat,
    Plus,
} from "lucide-react";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";
import { UserTier, canAccessAnalytics, canAccessInvestments } from "@/lib/tier-gate";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useSecurity } from "@/components/SecurityProvider";
import { useDashboardData } from "@/frontend/hooks/useDashboardData";
import { useI18n } from "@/frontend/lib/i18n-context";
import { QuickStatsSummary } from "@/frontend/components/QuickStatsSummary";
import { TransactionQuickFilters, filterTransactionsByPeriod } from "@/frontend/components/TransactionQuickFilters";
import { BillReminderWidget } from "@/frontend/components/BillReminderWidget";
import { HeroBalanceCard } from "./components/HeroBalanceCard";
import { BalanceDetailModal } from "./components/BalanceDetailModal";
import { OnboardingCard } from "./components/OnboardingCard";
import { StatsSkeleton, FeatureGridSkeleton, ListSkeleton } from "@/frontend/components/Skeleton";

import type { LucideIcon } from "lucide-react";

const TIER_STYLES: Record<UserTier, { label: string; color: string; bg: string; icon: LucideIcon; border: string }> = {
    starter: { label: "Starter", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: Zap },
    pro: { label: "Pro", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-100 dark:border-sky-800", icon: Sparkles },
    sultan: { label: "Sultan", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800", icon: Crown },
};

const mainFeatures = [
    { label: "features.monev_ai", icon: <Sparkles size={24} />, color: "purple", href: "/chat" },
    { label: "features.analytics", icon: <PieChart size={24} />, color: "sky", href: "/analytics" },
    { label: "features.budgets", icon: <Wallet size={24} />, color: "orange", href: "/budgets" },
    { label: "features.savings", icon: <PiggyBank size={24} />, color: "emerald", href: "/savings" },
    { label: "features.simulations", icon: <Zap size={24} />, color: "purple", href: "/simulations" },
    { label: "features.bills", icon: <Receipt size={24} />, color: "rose", href: "/bills" },
    { label: "features.investments", icon: <TrendingUp size={24} />, color: "amber", href: "/investments" },
    { label: "features.debts", icon: <Users size={24} />, color: "rose", href: "/debts" },
    { label: "features.recurring", icon: <Repeat size={24} />, color: "emerald", href: "/recurring" },
];

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

export default function Home() {
    const { t } = useI18n();
    const {
        transactions,
        allTransactions,
        stats,
        userName,
        userTier,
        userImage,
        anomalies,
        bills,
        loading,
        mounted,
        refresh
    } = useDashboardData();

    const [transactionFilter, setTransactionFilter] = useState<"today" | "week" | "month" | "all">("today");
    const [showBalanceDetail, setShowBalanceDetail] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const { isStealthMode, toggleStealth } = useSecurity();
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const toast = useToast();
    const haptics = useHaptics();

    // Calculate today's stats
    const todayStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTransactions = allTransactions.filter(t => {
            const transDate = new Date(t.createdAt);
            transDate.setHours(0, 0, 0, 0);
            return transDate.getTime() === today.getTime();
        });

        const income = todayTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = todayTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            count: todayTransactions.length
        };
    }, [allTransactions]);

    // Filter transactions based on selected period
    const filteredTransactions = useMemo(() => {
        return filterTransactionsByPeriod(transactions, transactionFilter);
    }, [transactions, transactionFilter]);

    const handleRefresh = async () => {
        haptics.medium();
        await refresh();
    };

    // Toggle handler with persistence
    const handleToggleHideBalance = async () => {
        haptics.tap();
        await toggleStealth();
    };

    const today = new Date();
    const formattedDate = mounted ? format(today, "EEEE, d MMMM yyyy", { locale: id }) : "";

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="relative min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
                <header className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50">
                    <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/profile" className="flex items-center gap-3 group active:scale-95 transition-transform">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 p-[2px] shadow-lg shadow-sky-500/20"
                                >
                                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                        {userImage ? (
                                            <Image
                                                src={userImage.split('?')[0]}
                                                alt={userName || "User"}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : !userName ? (
                                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                                                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-sky-100 to-cyan-50 dark:from-sky-900 dark:to-cyan-900 flex items-center justify-center text-base font-bold text-sky-700 dark:text-sky-300">
                                                {userName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                                <div className="flex flex-col">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{formattedDate}</p>
                                    <h1 className="text-sm font-bold text-foreground tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        {!userName ? (
                                            <span className="inline-block w-24 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md align-middle" />
                                        ) : (
                                            `Hello, ${userName.split(" ")[0]}! 👋`
                                        )}
                                    </h1>
                                </div>
                            </Link>

                            <div className="flex items-center gap-1.5 pt-4">
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded-md border flex items-center gap-1",
                                    TIER_STYLES[userTier].bg,
                                    TIER_STYLES[userTier].border
                                )}>
                                    {(() => {
                                        const Icon = TIER_STYLES[userTier].icon;
                                        return <Icon size={8} className={TIER_STYLES[userTier].color} />;
                                    })()}
                                    <span className={cn("text-[8px] font-black uppercase tracking-tighter", TIER_STYLES[userTier].color)}>
                                        {TIER_STYLES[userTier].label}
                                    </span>
                                </div>

                                {/* Streak Badge */}
                                {stats.streak && stats.streak.current > 0 && (
                                    <div className="px-1.5 py-0.5 rounded-md border border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-900/10 flex items-center gap-1">
                                        <span className="text-[8px]">🔥</span>
                                        <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter" title={`Longest: ${stats.streak.longest} hari`}>
                                            {stats.streak.current} Hari
                                        </span>
                                    </div>
                                )}

                                <Link
                                    href="/fitur/upgrade"
                                    className="text-[8px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1.5"
                                >
                                    Ganti Paket <ChevronRight size={8} />
                                </Link>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="relative w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-700 hover:shadow-xl hover:shadow-sky-200/50 dark:hover:shadow-sky-900/50 transition-all"
                        >
                            <Bell size={18} strokeWidth={2.5} />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white animate-pulse" />
                        </motion.button>
                    </div>
                </header>

                {/* Balance Card */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="px-6 pt-4 mb-6"
                >
                    <HeroBalanceCard
                        stats={stats}
                        mounted={mounted}
                        onBalanceClick={() => setShowBalanceDetail(true)}
                        onTransferClick={() => setShowTransferModal(true)}
                        hideBalance={isStealthMode}
                        onToggleHideBalance={handleToggleHideBalance}
                    />
                </motion.section>

                {/* Onboarding Card - Show when no accounts */}
                <OnboardingCard show={stats.accountCount === 0} />

                {/* Bill Reminder Widget */}
                {mounted && bills && bills.length > 0 && (
                    <BillReminderWidget bills={bills} />
                )}

                {/* Health Score Widget */}
                {stats.healthScore && (
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="px-6 mb-6"
                    >
                        <HealthScoreWidget data={stats.healthScore} />
                    </motion.section>
                )}

                {/* Quick Stats Summary */}
                <QuickStatsSummary
                    todayIncome={todayStats.income}
                    todayExpense={todayStats.expense}
                    todayTransactionCount={todayStats.count}
                    weeklyBudgetRemaining={stats.weeklyBudgetRemaining || 0}
                    weeklyBudgetTotal={stats.weeklyBudgetTotal || 0}
                    currentStreak={stats.streak?.current || 0}
                    longestStreak={stats.streak?.longest || 0}
                    mounted={mounted}
                    isStealthMode={isStealthMode}
                />

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="px-6 mb-8"
                >
                    <DailyInsight />
                </motion.section>

                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="px-6 mb-8"
                >
                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                        <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Fitur Andalan</h2>
                        <Link href="/fitur" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1">
                            {t("dashboard.viewAll")}
                            <ChevronRight size={14} />
                        </Link>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-3 gap-y-8 gap-x-4 justify-items-center"
                    >
                        {mainFeatures.map((feature) => {
                            const isLocked =
                                (feature.label === "features.analytics" && !canAccessAnalytics(userTier)) ||
                                (feature.label === "features.investments" && !canAccessInvestments(userTier));

                            return (
                                <Link
                                    key={feature.label}
                                    href={feature.href}
                                    className="relative group"
                                >
                                    <FeatureItem
                                        label={t(feature.label)}
                                        icon={feature.icon}
                                        color={feature.color}
                                    />
                                    {isLocked && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                            <Lock size={10} className="text-slate-400" />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </motion.div>
                </motion.section>

                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="px-6"
                >
                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
                        <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">{t("dashboard.recentTransactions")}</h2>
                        <Link href="/transactions" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
                            {t("dashboard.viewAll")}
                        </Link>
                    </motion.div>

                    {/* Quick Filters */}
                    <motion.div variants={itemVariants} className="mb-4">
                        <TransactionQuickFilters
                            activeFilter={transactionFilter}
                            onFilterChange={setTransactionFilter}
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-3">
                        {loading ? (
                            <TransactionListSkeleton count={3} />
                        ) : filteredTransactions.length === 0 ? (
                            <NoTransactionsEmpty onAddNew={() => setIsAddSheetOpen(true)} />
                        ) : (
                            filteredTransactions.slice(0, 5).map((t) => (
                                <TransactionItem key={t.id} transaction={t} />
                            ))
                        )}
                    </motion.div>
                </motion.section>

                <BalanceDetailModal
                    show={showBalanceDetail}
                    mounted={mounted}
                    stats={stats}
                    onClose={() => setShowBalanceDetail(false)}
                />

                <TransferModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={() => {
                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                        toast.success(t("dashboard.transferSuccess"), t("dashboard.transferMessage"));
                    }}
                    currentBalance={stats.balance}
                />

                <AddTransactionSheet
                    isOpen={isAddSheetOpen}
                    onClose={() => setIsAddSheetOpen(false)}
                    onSuccess={() => {
                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                        refresh();
                    }}
                />

                {/* Floating Add Transaction Button */}
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        haptics.medium();
                        setIsAddSheetOpen(true);
                    }}
                    className={cn(
                        "fixed bottom-28 right-6 z-[90] w-14 h-14 rounded-full",
                        "bg-gradient-to-br from-sky-400 to-sky-600",
                        "shadow-lg shadow-sky-500/30",
                        "flex items-center justify-center",
                        "text-white",
                        "hover:shadow-xl hover:shadow-sky-500/40",
                        "active:shadow-md",
                        "transition-shadow"
                    )}
                    aria-label={t("dashboard.addTransaction")}
                >
                    <Plus size={28} strokeWidth={2.5} />
                </motion.button>

            </div>
        </PullToRefresh>
    );
}
