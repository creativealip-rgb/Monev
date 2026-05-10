"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { TransferModal } from "@/frontend/components/TransferModal";
import { AddTransactionSheet } from "@/frontend/components/AddTransactionSheet";
import { useToast } from "@/frontend/components/UI";

import { PullToRefresh } from "@/components/PullToRefresh";
import { useSecurity } from "@/components/SecurityProvider";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useI18n } from "@/lib/i18n";
import { useAIInsight } from "@/frontend/hooks/useAIInsight";

import { DashboardHeader } from "./components/widgets/DashboardHeader";
import { HeroBalanceWidget } from "./components/widgets/HeroBalanceWidget";
import { QuickStatsWidget } from "./components/widgets/QuickStatsWidget";
import { OnboardingCard } from "./components/OnboardingCard";
import { BalanceDetailModal } from "./components/BalanceDetailModal";
import { NotificationsModal } from "@/frontend/components/modals/NotificationsModal";

import { useDashboardStats } from "./hooks/useDashboardStats";
import { useOnboarding } from "./hooks/useOnboarding";

import { motion } from "framer-motion";

const WidgetSkeleton = ({ className = "h-28" }: { className?: string }) => (
    <div className={`mx-4 mb-4 rounded-[1.75rem] bg-white/80 p-4 shadow-sm dark:bg-slate-900 ${className}`}>
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
);

const HealthScoreWidget = dynamic(
    () => import("@/frontend/components/HealthScoreWidget").then(mod => mod.HealthScoreWidget),
    { loading: () => <WidgetSkeleton /> }
);
const BillReminderWidget = dynamic(
    () => import("@/frontend/components/BillReminderWidget").then(mod => mod.BillReminderWidget),
    { loading: () => <WidgetSkeleton /> }
);
const SmartNotificationCard = dynamic(
    () => import("./components/SmartNotificationCard").then(mod => mod.SmartNotificationCard),
    { loading: () => <WidgetSkeleton /> }
);
const QuickAddShortcutsWidget = dynamic(
    () => import("./components/QuickAddShortcutsWidget").then(mod => mod.QuickAddShortcutsWidget),
    { loading: () => <WidgetSkeleton /> }
);
const RecurringSuggestionsCard = dynamic(
    () => import("./components/RecurringSuggestionsCard").then(mod => mod.RecurringSuggestionsCard),
    { loading: () => <WidgetSkeleton /> }
);
const AIInsightSection = dynamic(
    () => import("./components/AIInsightSection").then(mod => mod.AIInsightSection),
    { loading: () => <WidgetSkeleton /> }
);
const FeaturesWidget = dynamic(
    () => import("./components/widgets/FeaturesWidget").then(mod => mod.FeaturesWidget),
    { loading: () => <WidgetSkeleton className="h-36" /> }
);
const RecentTransactionsWidget = dynamic(
    () => import("./components/widgets/RecentTransactionsWidget").then(mod => mod.RecentTransactionsWidget),
    { loading: () => <WidgetSkeleton className="h-56" /> }
);

export default function DashboardPage() {
    const { t } = useI18n();
    const haptics = useHaptics();
    const toast = useToast();
    const { isStealthMode, toggleStealth } = useSecurity();

    const {
        allTransactions,
        stats,
        userName,
        userTier,
        userImage,
        bills,
        loading,
        mounted,
        todayStats,
        refresh,
    } = useDashboardStats();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { insight, loading: insightLoading, refresh: refreshInsight } = useAIInsight(currentYear, currentMonth, "id");

    const { hasCompletedOnboarding } = useOnboarding(stats.accountCount || 0);

    const [showBalanceDetail, setShowBalanceDetail] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const today = new Date();
    const formattedDate = mounted ? format(today, "EEEE, d MMMM yyyy", { locale: id }) : "";
    const hasOpenOverlay = showBalanceDetail || showTransferModal || isAddSheetOpen;

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: hasOpenOverlay }));
        return () => {
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
        };
    }, [hasOpenOverlay]);

    const handleRefresh = async () => {
        haptics.medium();
        await refresh();
    };

    const handleRefreshInsight = async () => {
        haptics.tap();
        await refreshInsight();
    };

    const handleToggleHideBalance = async () => {
        haptics.tap();
        await toggleStealth();
    };

    const handleTransferSuccess = () => {
        window.dispatchEvent(new CustomEvent("transactionAdded"));
        toast.success(t("dashboard.transferSuccess"), t("dashboard.transferMessage"));
    };

    const handleAddTransactionSuccess = () => {
        window.dispatchEvent(new CustomEvent("transactionAdded"));
        refresh();
    };

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="relative min-h-screen bg-sky-50 pb-32 dark:bg-slate-950">
                <DashboardHeader
                    userName={userName}
                    userImage={userImage}
                    userTier={userTier}
                    streak={stats.streak}
                    formattedDate={formattedDate}
                    mounted={mounted}
                    onNotificationsClick={() => setIsNotificationsOpen(true)}
                />

                <HeroBalanceWidget
                    stats={stats}
                    mounted={mounted}
                    onBalanceClick={() => setShowBalanceDetail(true)}
                    onTransferClick={() => setShowTransferModal(true)}
                    hideBalance={isStealthMode}
                    onToggleHideBalance={handleToggleHideBalance}
                />

                {!hasCompletedOnboarding && stats.accountCount === 0 && (
                    <OnboardingCard show={true} />
                )}

                {mounted && bills && bills.length > 0 && (
                    <BillReminderWidget bills={bills} />
                )}

                <SmartNotificationCard />

                <QuickAddShortcutsWidget onSuccess={handleAddTransactionSuccess} />

                <RecurringSuggestionsCard />

                {stats.healthScore && (
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        className="px-4 mb-4 sm:px-6 sm:mb-6"
                    >
                        <HealthScoreWidget data={stats.healthScore} />
                    </motion.section>
                )}

                <QuickStatsWidget
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

                <AIInsightSection
                    insight={insight}
                    loading={insightLoading}
                    onRefresh={handleRefreshInsight}
                />

                <FeaturesWidget userTier={userTier} />

                <RecentTransactionsWidget
                    transactions={allTransactions}
                    loading={loading}
                    mounted={mounted}
                    isStealthMode={isStealthMode}
                    onAddNew={() => setIsAddSheetOpen(true)}
                />

                <BalanceDetailModal
                    show={showBalanceDetail}
                    mounted={mounted}
                    stats={stats}
                    onClose={() => setShowBalanceDetail(false)}
                />

                <TransferModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={handleTransferSuccess}
                />

                <AddTransactionSheet
                    isOpen={isAddSheetOpen}
                    onClose={() => setIsAddSheetOpen(false)}
                    onSuccess={handleAddTransactionSuccess}
                />

                <NotificationsModal
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                />

            </div>
        </PullToRefresh>
    );
}
