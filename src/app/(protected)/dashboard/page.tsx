"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { TransferModal } from "@/frontend/components/TransferModal";
import { AddTransactionSheet } from "@/frontend/components/AddTransactionSheet";
import { HealthScoreWidget } from "@/frontend/components/HealthScoreWidget";
import { BillReminderWidget } from "@/frontend/components/BillReminderWidget";
import { useToast } from "@/frontend/components/UI";

import { PullToRefresh } from "@/components/PullToRefresh";
import { useSecurity } from "@/components/SecurityProvider";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useI18n } from "@/lib/i18n";
import { useAIInsight } from "@/frontend/hooks/useAIInsight";

import { DashboardHeader } from "./components/widgets/DashboardHeader";
import { HeroBalanceWidget } from "./components/widgets/HeroBalanceWidget";
import { QuickStatsWidget } from "./components/widgets/QuickStatsWidget";
import { RecentTransactionsWidget } from "./components/widgets/RecentTransactionsWidget";
import { FeaturesWidget } from "./components/widgets/FeaturesWidget";
import { AIInsightSection } from "./components/AIInsightSection";
import { OnboardingCard } from "./components/OnboardingCard";
import { BalanceDetailModal } from "./components/BalanceDetailModal";
import { NotificationsModal } from "@/frontend/components/modals/NotificationsModal";

import { useDashboardStats } from "./hooks/useDashboardStats";
import { useOnboarding } from "./hooks/useOnboarding";

import { motion } from "framer-motion";

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
