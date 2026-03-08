"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import {
    Calendar, ChevronRight, Lock, ArrowLeft, FileDown, Flame
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import Link from "next/link";
import { ErrorEmpty } from "@/frontend/components/EmptyState";
import { useSession } from "next-auth/react";
import { UserTier, hasFullAnalytics } from "@/lib/tier-gate";
import { useToast } from "@/frontend/components/UI";
import { useSecurity } from "@/components/SecurityProvider";

// Components
import { NetWorthCard } from "./components/NetWorthCard";
import { FinancialMap } from "./components/FinancialMap";
import { OverviewTab } from "./components/OverviewTab";
import { TrendsTab } from "./components/TrendsTab";
import { InsightsTab } from "./components/InsightsTab";

// Types
import type { AnalyticsData } from "./components/types";

export default function AnalyticsPage() {
const [activeTab, setActiveTab] = useState("overview");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();
    const { isStealthMode } = useSecurity();
    const userTier: UserTier = session?.user?.tier || "miskin";
    const toast = useToast();
    // Use data.canAccessAIInsights from API (reads from DB) as primary source,
    // fall back to session-based check. This prevents lock when session fetch fails transiently.
    const canSeeFullAnalytics = data?.canAccessAIInsights ?? hasFullAnalytics(userTier);

    const tabs = [
        { id: "overview", label: "Ringkasan" },
        { id: "map", label: "Peta", locked: false },
        { id: "trends", label: "Tren", locked: !canSeeFullAnalytics },
        { id: "insights", label: "Insight", locked: !canSeeFullAnalytics }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const [isDownloading, setIsDownloading] = useState(false);

const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let url = `/api/analytics?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`;
            if (dateRange) {
                url = `/api/analytics?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }
            const res = await apiFetch(url);
            if (!res.ok) throw new Error("Gagal memuat data");
            const jsonData = await res.json();
            setData(jsonData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!data) return;
        // Tier gate: only Kaya/Sultan
        if (!canSeeFullAnalytics) {
            toast.error("Fitur Premium", "Export PDF tersedia untuk tier Kaya dan Sultan.");
            return;
        }
        setIsDownloading(true);
        try {
            const { exportAnalyticsPDF } = await import("@/lib/pdf-export");
            await exportAnalyticsPDF({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
                income: data.income || 0,
                expense: data.expense || 0,
                balance: (data.income || 0) - (data.expense || 0),
                categoryStats: [
                    ...(data.categoryBreakdown?.expense || []),
                    ...(data.categoryBreakdown?.income || []),
                ].map((cat: any) => ({
                    categoryName: cat.categoryName || cat.name,
                    total: cat.total || cat.amount || 0,
                })),
            });
            toast.success("Berhasil", "Laporan PDF berhasil diunduh!");
        } catch (err) {
            console.error("PDF export error:", err);
            toast.error("Gagal Unduh", "Terjadi kesalahan saat membuat laporan.");
        } finally {
            setIsDownloading(false);
        }
    };

useEffect(() => {
        fetchData();
    }, [currentDate, dateRange]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!data || error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <ErrorEmpty
                    title="Gagal memuat data"
                    description={error || "Data analitik tidak tersedia"}
                    onRetry={fetchData}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            {/* Standardized Header */}
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
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Statistik</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Ringkasan Keuangan Anda</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Download Report Button */}
                        <button
                            onClick={handleDownloadReport}
                            disabled={isDownloading}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-[10px] font-bold shadow-lg shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50",
                                isDownloading && "animate-pulse"
                            )}
                        >
                            <FileDown size={14} />
                            <span>Laporan</span>
                        </button>

{/* Month Selector Mini */}
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm">
                            <div className="flex items-center gap-1.5 px-3 border-r border-slate-200 dark:border-slate-800">
                                <Flame size={12} className="text-orange-500" />
                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                    {(data as any)?.summary?.streakDays || 0}
                                </span>
                            </div>
                            {dateRange ? (
                                <button
                                    onClick={() => {
                                        setDateRange(null);
                                        setCurrentDate(new Date());
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                                >
                                    <Calendar size={12} className="text-sky-500" />
                                    <span className="text-[10px] font-bold px-1 min-w-[60px] text-center text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                        Custom
                                    </span>
                                    <span className="text-[8px] text-slate-400">✕</span>
                                </button>
                            ) : (
                                <div className="flex items-center px-1 py-1">
                                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                        <ChevronRight className="rotate-180 w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <span className="text-[10px] font-bold px-2 min-w-[80px] text-center text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                        {currentDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                                    </span>
                                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                                className={cn(
                                    "p-1.5 mx-1 rounded-full transition-all",
                                    showDateRangePicker || dateRange
                                        ? "bg-sky-100 dark:bg-sky-900/30 text-sky-600"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                                )}
                            >
                                <Calendar size={14} />
                            </button>
                        </div>
                    </div>
</div>
            </motion.header>

            {/* Date Range Picker Dropdown */}
            {showDateRangePicker && (
                <motion.div
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
                                { label: "Minggu ini", days: 7 },
                                { label: "Bulan ini", days: 30 },
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

            <div className="p-6 space-y-6">
                <NetWorthCard
                    balance={data.balance}
                    investments={data.totalInvestments || 0}
                    goals={data.goalsProgress?.reduce((acc: any, g: any) => acc + g.currentAmount, 0) || 0}
                    hideBalance={isStealthMode}
                />

                <div className="sticky top-20 z-30 -mx-6 px-6 py-2 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
                    <div className="flex gap-2 mb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.locked) {
                                        toast.error("Fitur Terkunci", "Upgrade ke Kaya atau Sultan untuk akses fitur ini! 🚀");
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
                {activeTab === "overview" && <OverviewTab data={data} itemVariants={itemVariants} />}
                {activeTab === "map" && (
                    <motion.div variants={itemVariants}>
                        <FinancialMap
                            month={currentDate.getMonth() + 1}
                            year={currentDate.getFullYear()}
                            hideBalance={isStealthMode}
                        />
                    </motion.div>
                )}
                {activeTab === "trends" && <TrendsTab data={data} itemVariants={itemVariants} />}
                {activeTab === "insights" && <InsightsTab data={data} itemVariants={itemVariants} />}
            </motion.div>
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