"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Calendar, ChevronRight, Lock, ArrowLeft, FileDown, Flame
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/frontend/lib/utils";
import Link from "next/link";
import { ErrorEmpty } from "@/frontend/components/EmptyState";
import { useSession } from "next-auth/react";
import { UserTier, hasFullAnalytics } from "@/lib/tier-gate";
import { useToast } from "@/frontend/components/UI";
import { useSecurity } from "@/components/SecurityProvider";
import { useI18n } from "@/lib/i18n";

// Components - NetWorthCard is above the fold, keep static
import { NetWorthCard } from "./components/NetWorthCard";
import { OverviewTab } from "./components/OverviewTab";
import { TrendsTab } from "./components/TrendsTab";
import { InsightsTab } from "./components/InsightsTab";
import {
    FinancialMap,
    preloadFinancialMapChart
} from "./components/FinancialMap";
import { AnalyticsTransactionsModal } from "./components/AnalyticsTransactionsModal";

// Types
import type {
    AnalyticsData,
    AnalyticsDrilldownFilter,
    CategoryBreakdown,
    GoalProgress,
    MonthlyStat
} from "./components/types";
import { getAnalyticsActionItems } from "./components/InsightsTab";
import {
    getAccountsQueryOptions,
    getAnalyticsQueryOptions,
    getExpenseCategoriesQueryOptions,
    getFinancialMapQueryOptions,
    type AnalyticsFilterOption,
} from "./hooks/useAnalyticsQueries";

export default function AnalyticsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("overview");
    const [currentDate, setCurrentDate] = useState(new Date());
    const hasAutoAdjustedMonthRef = useRef(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const dateRangePickerRef = useRef<HTMLDivElement>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
    const [drilldownFilter, setDrilldownFilter] = useState<AnalyticsDrilldownFilter | null>(null);
    const [mapFocusLabel, setMapFocusLabel] = useState<string | null>(null);
    const { data: session } = useSession();
    const { isStealthMode } = useSecurity();
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const userTier: UserTier = session?.user?.tier || "starter";
    const toast = useToast();
    const analyticsFilters = useMemo(() => ({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        startDate: dateRange?.start || null,
        endDate: dateRange?.end || null,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
    }), [currentDate, dateRange, selectedAccountId, selectedCategoryId]);
    const analyticsQuery = useQuery(getAnalyticsQueryOptions(analyticsFilters));
    const accountsQuery = useQuery(getAccountsQueryOptions());
    const categoriesQuery = useQuery(getExpenseCategoriesQueryOptions());
    const data: AnalyticsData | null = analyticsQuery.data || null;
    const accounts: AnalyticsFilterOption[] = accountsQuery.data || [];
    const categories: AnalyticsFilterOption[] = categoriesQuery.data || [];
    const canSeeFullAnalytics = data?.canAccessAIInsights ?? hasFullAnalytics(userTier);

    const tabs = useMemo(() => [
        { id: "overview", label: t("analytics.overview") },
        { id: "map", label: t("analytics.map"), locked: false },
        { id: "trends", label: t("analytics.trends"), locked: !canSeeFullAnalytics },
        { id: "insights", label: t("analytics.insights"), locked: !canSeeFullAnalytics }
    ], [canSeeFullAnalytics, t]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tabs.some((item) => item.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams, tabs]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };


    const selectedAccountLabel = selectedAccountId === "all"
        ? "Semua akun"
        : accounts.find((account) => String(account.id) === selectedAccountId)?.name || "Semua akun";
    const selectedCategoryLabel = selectedCategoryId === "all"
        ? "Semua kategori"
        : categories.find((category) => String(category.id) === selectedCategoryId)?.name || "Semua kategori";
    const selectedPeriodLabel = dateRange
        ? `${dateRange.start} s/d ${dateRange.end}`
        : `${currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })} · ${selectedAccountLabel} · ${selectedCategoryLabel}`;

    useEffect(() => {
        if (!data || dateRange || hasAutoAdjustedMonthRef.current) {
            return;
        }

        const income = Number(data.income || 0);
        const expense = Number(data.expense || 0);
        const monthlyComparison: MonthlyStat[] = Array.isArray(data.monthlyComparison)
            ? data.monthlyComparison
            : [];

        if (income !== 0 || expense !== 0 || monthlyComparison.length === 0) {
            return;
        }

        const latestMonthWithData = [...monthlyComparison]
            .reverse()
            .find((item) => Number(item?.income || 0) > 0 || Number(item?.expense || 0) > 0);

        if (
            latestMonthWithData?.month &&
            latestMonthWithData?.year &&
            (
                currentDate.getMonth() + 1 !== latestMonthWithData.month
                || currentDate.getFullYear() !== latestMonthWithData.year
            )
        ) {
            hasAutoAdjustedMonthRef.current = true;
            setCurrentDate(new Date(latestMonthWithData.year, latestMonthWithData.month - 1, 1));
        }
    }, [currentDate, data, dateRange]);

    useEffect(() => {
        if (!data) {
            return;
        }

        const runPrefetch = () => {
            preloadFinancialMapChart().catch(() => null);
            queryClient.prefetchQuery(getFinancialMapQueryOptions(analyticsFilters)).catch(() => null);

            if (canSeeFullAnalytics && !data.insights) {
                queryClient.prefetchQuery({
                    queryKey: ["analytics", "ai-insight"],
                    queryFn: async () => {
                        const response = await fetch("/api/ai/insight");
                        return response.json();
                    },
                    staleTime: 60 * 1000,
                }).catch(() => null);
            }
        };

        const browserWindow = window as Window & {
            requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
            cancelIdleCallback?: (handle: number) => void;
        };
        const idleCallback = browserWindow.requestIdleCallback
            ? browserWindow.requestIdleCallback(runPrefetch, { timeout: 1500 })
            : globalThis.setTimeout(runPrefetch, 400);

        return () => {
            if (browserWindow.cancelIdleCallback && typeof idleCallback === "number") {
                browserWindow.cancelIdleCallback(idleCallback);
                return;
            }

            globalThis.clearTimeout(idleCallback as ReturnType<typeof setTimeout>);
        };
    }, [analyticsFilters, canSeeFullAnalytics, data, queryClient]);

    const periodRange = (() => {
        if (dateRange) {
            return {
                startDate: dateRange.start,
                endDate: dateRange.end,
            };
        }

        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        return {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        };
    })();
    const sharedDrilldownFilter = {
        ...periodRange,
        accountId: selectedAccountId !== "all" ? Number(selectedAccountId) : undefined,
        categoryId: selectedCategoryId !== "all" ? Number(selectedCategoryId) : undefined,
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const isLoading = analyticsQuery.isLoading || accountsQuery.isLoading || categoriesQuery.isLoading;
    const error = analyticsQuery.error instanceof Error
        ? analyticsQuery.error.message
        : accountsQuery.error instanceof Error
            ? accountsQuery.error.message
            : categoriesQuery.error instanceof Error
                ? categoriesQuery.error.message
                : null;

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!data || error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <ErrorEmpty
                    title={t("analytics.failedToLoadTitle")}
                    description={error || t("analytics.failedToLoadDesc")}
                    onRetry={() => analyticsQuery.refetch()}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-x-hidden pb-28 bg-sky-50 dark:bg-slate-950">
            {/* Standardized Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Statistik</h1>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Ringkasan Keuangan Anda</p>
                        </div>
                    </div>


</div>
            </motion.header>

            {/* Date Range Picker Dropdown */}
            {showDateRangePicker && (
                <motion.div
                    ref={dateRangePickerRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-6 top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 z-[200] w-72"
                >
                    <p className="text-xs font-bold text-muted-foreground mb-3 uppercase">Pilih Tanggal</p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-muted-foreground">Mulai</label>
                            <input
                                type="date"
                                value={dateRange?.start || ""}
                                onChange={(e) => setDateRange(prev => prev ? { ...prev, start: e.target.value } : { start: e.target.value, end: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground">Akhir</label>
                            <input
                                type="date"
                                value={dateRange?.end || ""}
                                onChange={(e) => setDateRange(prev => prev ? { ...prev, end: e.target.value } : { start: e.target.value, end: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            {[
                                { label: t("analytics.thisWeek"), days: 7 },
                                { label: t("analytics.thisMonth"), days: 30 },
                                { label: "3 Bulan", days: 90 },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        const end = new Date();
                                        const start = new Date();
                                        start.setDate(end.getDate() - preset.days);
                                        setDateRange({
                                            start: start.toISOString().split("T")[0],
                                            end: end.toISOString().split("T")[0]
                                        });
                                    }}
                                    className="flex-1 px-2 py-1.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                if (dateRange?.start && dateRange?.end) {
                                    setShowDateRangePicker(false);
                                }
                            }}
                            disabled={!dateRange?.start || !dateRange?.end}
                            className="w-full py-2 bg-sky-500 text-white text-sm font-bold rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Terapkan
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Main Content Area */}
            <div className={cn(
                "transition-all duration-300",
                analyticsQuery.isFetching && "opacity-60 pointer-events-none grayscale-[0.2]"
            )}>
                <div className="p-6 space-y-6">
                    <NetWorthCard
                    balance={data.balance}
                    investments={data.totalInvestments || 0}
                    goals={data.goalsProgress?.reduce((acc: number, g: GoalProgress) => acc + g.currentAmount, 0) || 0}
                    hideBalance={isStealthMode}
                    headerAction={
                        <div className="flex shrink-0 items-center bg-white/10 border border-white/10 rounded-full shadow-sm text-white relative z-20">
                            <div className="hidden sm:flex items-center gap-1.5 px-3 border-r border-white/10">
                                <Flame size={12} className="text-orange-400" />
                                <span className="text-[10px] font-bold text-orange-400">
                                    {data.summary?.streakDays || 0}
                                </span>
                            </div>
                            {dateRange ? (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDateRange(null);
                                        setCurrentDate(new Date());
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded-full transition-all"
                                >
                                    <Calendar size={12} className="text-sky-300" />
                                    <span className="text-[10px] font-bold px-1 min-w-[60px] text-center text-white uppercase tracking-tighter">
                                        Custom
                                    </span>
                                    <span className="text-[8px] text-white/60">✕</span>
                                </button>
                            ) : (
                                <div className="flex items-center px-1 py-1">
                                    <button onClick={(e) => { e.preventDefault(); changeMonth(-1); }} className="p-1 hover:bg-white/10 rounded-full transition-all">
                                        <ChevronRight className="rotate-180 w-3.5 h-3.5 text-white/60" />
                                    </button>
                                    <span className="text-[10px] font-bold px-1.5 min-w-[64px] text-center text-white capitalize tracking-tight sm:px-2 sm:min-w-[80px]">
                                        {currentDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                                    </span>
                                    <button onClick={(e) => { e.preventDefault(); changeMonth(1); }} className="p-1 hover:bg-white/10 rounded-full transition-all">
                                        <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={(e) => { e.preventDefault(); setShowDateRangePicker(!showDateRangePicker); }}
                                aria-label="Toggle date picker"
                                className={cn(
                                    "p-1.5 mx-1 rounded-full transition-all",
                                    showDateRangePicker || dateRange
                                        ? "bg-sky-500/30 text-sky-300"
                                        : "hover:bg-white/10 text-white/60"
                                )}
                            >
                                <Calendar size={14} />
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Akun</span>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="all">Semua akun</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kategori</span>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="all">Semua kategori</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="sticky top-20 z-30 -mx-6 px-6 py-2 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
                    <div className="flex gap-2 mb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.locked) {
                                        toast.error(t("analytics.featureLocked"), t("analytics.upgradeForAccess"));
                                        return;
                                    }
                                    setActiveTab(tab.id);
                                }}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    activeTab === tab.id
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                        : "bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800"
                                )}
                            >
                                {tab.label}
                                {tab.locked && <Lock size={10} className="opacity-60" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <motion.div
                className="p-6 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={activeTab} // Animate on tab change
            >
                {activeTab === "overview" && (
                    <OverviewTab
                        data={data}
                        itemVariants={itemVariants}
                        periodLabel={selectedPeriodLabel}
                        onOpenDrilldown={setDrilldownFilter}
                        baseFilter={sharedDrilldownFilter}
                    />
                )}
                {activeTab === "map" && (
                    <motion.div variants={itemVariants}>
                        <FinancialMap
                            month={currentDate.getMonth() + 1}
                            year={currentDate.getFullYear()}
                            startDate={dateRange?.start || null}
                            endDate={dateRange?.end || null}
                            accountId={selectedAccountId}
                            categoryId={selectedCategoryId}
                            focusLabel={mapFocusLabel}
                            onOpenDrilldown={setDrilldownFilter}
                        />
                    </motion.div>
                )}
                {activeTab === "trends" && (
                    <TrendsTab
                        data={data}
                        itemVariants={itemVariants}
                        periodLabel={selectedPeriodLabel}
                        onOpenDrilldown={setDrilldownFilter}
                    />
                )}
                {activeTab === "insights" && (
                    <InsightsTab
                        data={data}
                        itemVariants={itemVariants}
                        periodLabel={selectedPeriodLabel}
                        onOpenDrilldown={setDrilldownFilter}
                        baseFilter={sharedDrilldownFilter}
                    />
                )}
            </motion.div>
            </div>

            <AnalyticsTransactionsModal
                isOpen={drilldownFilter !== null}
                onClose={() => setDrilldownFilter(null)}
                filter={drilldownFilter}
                accounts={accounts}
                onFocusMap={(nextFilter) => {
                    if (nextFilter.accountId) {
                        setSelectedAccountId(String(nextFilter.accountId));
                    }
                    if (nextFilter.categoryId) {
                        setSelectedCategoryId(String(nextFilter.categoryId));
                    }
                    setMapFocusLabel(nextFilter.title);
                    setActiveTab("map");
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("tab", "map");
                    router.replace(`/analytics?${params.toString()}`, { scroll: false });
                }}
            />
        </div>
    );
}

// --- Skeleton ---
function AnalyticsSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
            <div className="sticky top-0 z-40 glass border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="px-6 py-4 pt-12 space-y-6">
                    <div className="flex justify-between">
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    </div>
                    <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
            </div>
            <div className="p-6 space-y-6">
                <div className="h-64 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse" />
                <div className="h-40 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse" />
            </div>
        </div>
    );
}
