"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboardData } from "@/frontend/hooks/useDashboardData";
import { apiFetch } from "@/frontend/lib/api-client";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { motion } from "framer-motion";
import {
    FileDown,
    Mail,
    Clock,
    TrendingUp,
    TrendingDown,
    PieChart,
    Target,
    Briefcase,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ArrowLeft,
    FileSpreadsheet,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { ErrorEmpty, useToast } from "@/frontend/components/UI";
import { Skeleton } from "@/frontend/components/Skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ReportHistory {
    id: string;
    type: string;
    period: string;
    createdAt: string;
    size: string;
}

interface ReportPreview {
    income: number;
    expense: number;
    balance: number;
    categories: Array<{ name: string; amount: number; type: "income" | "expense" }>;
    allocations: Array<{ name: string; amount: number; percentage: number; target: number }>;
    goalsProgress: Array<{ name: string; current: number; target: number; percentage: number }>;
    investments: Array<{ name: string; type: string; value: number }>;
    aiInsight: string;
}

type ReportType = "monthly" | "annual" | "custom";

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function ReportsPage() {
    const toast = useToast();
    const { loading: dashboardLoading } = useDashboardData();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState<ReportType>("monthly");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [reportPreview, setReportPreview] = useState<ReportPreview | null>(null);
    const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(true);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const loadReportHistory = async () => {
        try {
            setHistoryError(null);
            const res = await apiFetch("/api/reports/history");
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.error || "Gagal memuat riwayat laporan");
            }
            setReportHistory(json.data || []);
        } catch (error) {
            console.error("Failed to load report history:", error);
            setHistoryError(error instanceof Error ? error.message : "Gagal memuat riwayat laporan");
        } finally {
            setLoading(false);
        }
    };

    const fetchReportPreview = useCallback(async () => {
        try {
            setPreviewLoading(true);
            setPreviewError(null);
            const res = await apiFetch(
                `/api/analytics?month=${selectedMonth + 1}&year=${selectedYear}`
            );
            const json = await res.json();
            if (!res.ok || json.error) {
                throw new Error(json.error || "Gagal memuat preview laporan");
            }

            const categories = [
                ...(json.categoryBreakdown?.expense || []).map((category: Record<string, unknown>) => ({ ...category, type: "expense" })),
                ...(json.categoryBreakdown?.income || []).map((category: Record<string, unknown>) => ({ ...category, type: "income" })),
            ];

            const goalsProgress = (json.goalsProgress || []).map((goal: Record<string, unknown>) => ({
                name: String(goal.name || "Target"),
                current: Number(goal.current ?? goal.currentAmount ?? 0),
                target: Number(goal.target ?? goal.targetAmount ?? 0),
                percentage: Number(goal.percentage ?? goal.progress ?? 0),
            }));

            setReportPreview({
                income: json.income || 0,
                expense: json.expense || 0,
                balance: json.balance || 0,
                categories,
                allocations: json.allocations || [],
                goalsProgress,
                investments: json.investments || [],
                aiInsight: json.insights || "",
            });
        } catch (error) {
            console.error("Failed to fetch report preview:", error);
            setReportPreview(null);
            setPreviewError(error instanceof Error ? error.message : "Gagal memuat preview laporan");
        } finally {
            setPreviewLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        loadReportHistory();
    }, []);

    useEffect(() => {
        fetchReportPreview();
    }, [fetchReportPreview]);

    const handleGeneratePDF = useCallback(async () => {
        setIsGenerating(true);
        setGenerationProgress(0);

        const progressInterval = setInterval(() => {
            setGenerationProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        try {
            const params = new URLSearchParams();
            params.set("month", (selectedMonth + 1).toString());
            params.set("year", selectedYear.toString());
            params.set("type", reportType);

            if (reportType === "custom" && customStartDate && customEndDate) {
                params.set("startDate", customStartDate);
                params.set("endDate", customEndDate);
            }

            const response = await fetch(`/api/reports/generate?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/pdf" },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Gagal membuat laporan" }));
                throw new Error(errorData.error || "Gagal membuat laporan");
            }

            clearInterval(progressInterval);
            setGenerationProgress(100);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Monev_Laporan_${MONTH_NAMES[selectedMonth]}_${selectedYear}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Laporan berhasil dibuat", "PDF telah diunduh ke perangkat Anda");
            await loadReportHistory();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat PDF";
            toast.error("Gagal membuat laporan", message);
        } finally {
            clearInterval(progressInterval);
            setIsGenerating(false);
            setTimeout(() => setGenerationProgress(0), 500);
        }
    }, [selectedMonth, selectedYear, reportType, customStartDate, customEndDate, toast]);

    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams();
            params.set("month", (selectedMonth + 1).toString());
            params.set("year", selectedYear.toString());

            const response = await fetch(`/api/transactions/export?${params.toString()}`);
            if (!response.ok) throw new Error("Gagal export CSV");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Monev_Transactions_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("CSV berhasil diunduh", "File transaksi telah diunduh");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Terjadi kesalahan saat export";
            toast.error("Gagal export CSV", message);
        }
    };

    const handleEmailReport = () => {
        toast.info("Fitur segera hadir", "Email laporan akan tersedia dalam update berikutnya");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 }
    };

    const maxExpenseCategories = reportPreview?.categories
        .filter(c => c.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5) || [];

    const totalExpense = maxExpenseCategories.reduce((sum, c) => sum + c.amount, 0);
    const hasPreviewMoney = Boolean(reportPreview && (reportPreview.income > 0 || reportPreview.expense > 0 || reportPreview.balance > 0));

    return (
        <div className="min-h-screen pb-20 bg-sky-50 dark:bg-slate-950">
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
                            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Laporan Keuangan</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                                Buat dan ekspor laporan
                            </p>
                        </div>
                    </div>
                </div>
            </motion.header>

            <motion.div
                className="p-4 sm:p-6 space-y-5 sm:space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Report Configuration */}
                <motion.div variants={itemVariants} className="card-clean p-5">
                    <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-sky-500" />
                        Konfigurasi Laporan
                    </h2>

                    <div className="space-y-4">
                        {/* Report Type Selector */}
                        <div>
                            <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                Jenis Laporan
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { id: "monthly", label: "Bulanan" },
                                    { id: "annual", label: "Tahunan" },
                                    { id: "custom", label: "Kustom" },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setReportType(type.id as ReportType)}
                                        className={cn(
                                            "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all",
                                            reportType === type.id
                                                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                                                : "bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800"
                                        )}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Month/Year Selector */}
                        {reportType !== "custom" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                        Bulan
                                    </label>
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                                        <button
                                            onClick={() => setSelectedMonth((prev) => (prev - 1 + 12) % 12)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <ChevronLeft size={16} className="text-slate-400" />
                                        </button>
                                        <span className="flex-1 text-sm font-bold text-center text-slate-700 dark:text-slate-300">
                                            {MONTH_NAMES[selectedMonth]}
                                        </span>
                                        <button
                                            onClick={() => setSelectedMonth((prev) => (prev + 1) % 12)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <ChevronRight size={16} className="text-slate-400" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                        Tahun
                                    </label>
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                                        <button
                                            onClick={() => setSelectedYear((prev) => prev - 1)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <ChevronLeft size={16} className="text-slate-400" />
                                        </button>
                                        <span className="flex-1 text-sm font-bold text-center text-slate-700 dark:text-slate-300">
                                            {selectedYear}
                                        </span>
                                        <button
                                            onClick={() => setSelectedYear((prev) => prev + 1)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <ChevronRight size={16} className="text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Date Range */}
                        {reportType === "custom" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                        Tanggal Mulai
                                    </label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 block">
                                        Tanggal Akhir
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGeneratePDF}
                            disabled={isGenerating || (reportType === "custom" && (!customStartDate || !customEndDate))}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                                isGenerating
                                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 active:scale-[0.98]"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Membuat PDF... {generationProgress}%</span>
                                </>
                            ) : (
                                <>
                                    <FileDown size={18} />
                                    <span>Buat Laporan PDF</span>
                                </>
                            )}
                        </button>

                        {/* Export Options */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20 transition-all"
                            >
                                <FileSpreadsheet size={16} />
                                <span>Ekspor CSV</span>
                            </button>
                            <button
                                onClick={handleEmailReport}
                                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/10 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-200 dark:border-purple-800 hover:bg-purple-500/20 transition-all"
                            >
                                <Mail size={16} />
                                <span>Kirim PDF via Email</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Report Preview */}
                {loading || dashboardLoading || previewLoading ? (
                    <ReportPreviewSkeleton />
                ) : previewError ? (
                    <motion.div variants={itemVariants} className="card-clean p-5">
                        <ErrorEmpty
                            title="Gagal memuat preview laporan"
                            description={previewError}
                            onRetry={() => { void fetchReportPreview(); }}
                        />
                    </motion.div>
                ) : reportPreview ? (
                    <>
                        {/* Summary Cards */}
                        <motion.div variants={itemVariants} className={cn("grid grid-cols-3", hasPreviewMoney ? "gap-3" : "gap-2")}>
                            <div className={cn("card-clean bg-gradient-to-br from-emerald-500 to-emerald-600 text-white", hasPreviewMoney ? "p-4" : "p-3")}>
                                <div className="flex items-center gap-1 mb-2">
                                    <TrendingUp size={14} className="opacity-80" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">Pemasukan</span>
                                </div>
                                <p className="text-sm font-bold truncate">{formatCurrency(reportPreview.income)}</p>
                            </div>

                            <div className={cn("card-clean bg-gradient-to-br from-rose-500 to-rose-600 text-white", hasPreviewMoney ? "p-4" : "p-3")}>
                                <div className="flex items-center gap-1 mb-2">
                                    <TrendingDown size={14} className="opacity-80" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">Pengeluaran</span>
                                </div>
                                <p className="text-sm font-bold truncate">{formatCurrency(reportPreview.expense)}</p>
                            </div>

                            <div className={cn("card-clean bg-gradient-to-br from-sky-500 to-cyan-600 text-white", hasPreviewMoney ? "p-4" : "p-3")}>
                                <div className="flex items-center gap-1 mb-2">
                                    <PieChart size={14} className="opacity-80" />
                                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">Saldo</span>
                                </div>
                                <p className="text-sm font-bold truncate">{formatCurrency(reportPreview.balance)}</p>
                            </div>
                        </motion.div>

                        {/* 50/30/20 Allocation */}
                        <motion.div variants={itemVariants} className="card-clean p-5">
                            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <Target size={18} className="text-amber-500" />
                                Alokasi 50/30/20
                            </h2>
                            <div className="space-y-3">
                                {reportPreview.allocations.map((allocation) => (
                                    <div key={allocation.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                {allocation.name}
                                            </span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {allocation.percentage.toFixed(1)}% / {allocation.target}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    allocation.percentage > allocation.target
                                                        ? "bg-rose-500"
                                                        : "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">{formatCurrency(allocation.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Top 5 Expenses */}
                        <motion.div variants={itemVariants} className="card-clean p-5">
                            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <PieChart size={18} className="text-rose-500" />
                                Top 5 Pengeluaran
                            </h2>
                            <div className="space-y-3">
                                {maxExpenseCategories.map((category, index) => (
                                    <div key={category.name} className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white",
                                            index === 0 && "bg-rose-500",
                                            index === 1 && "bg-orange-500",
                                            index === 2 && "bg-amber-500",
                                            index === 3 && "bg-yellow-500",
                                            index === 4 && "bg-lime-500"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {category.name}
                                            </p>
                                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        index === 0 && "bg-rose-500",
                                                        index === 1 && "bg-orange-500",
                                                        index === 2 && "bg-amber-500",
                                                        index === 3 && "bg-yellow-500",
                                                        index === 4 && "bg-lime-500"
                                                    )}
                                                    style={{ width: `${totalExpense > 0 ? (category.amount / totalExpense) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {formatCurrency(category.amount)}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {totalExpense > 0 ? ((category.amount / totalExpense) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Goals Progress */}
                        {reportPreview.goalsProgress && reportPreview.goalsProgress.length > 0 && (
                            <motion.div variants={itemVariants} className="card-clean p-5">
                                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Target size={18} className="text-emerald-500" />
                                    Progress Tujuan
                                </h2>
                                <div className="space-y-3">
                                    {reportPreview.goalsProgress.slice(0, 3).map((goal) => (
                                        <div key={goal.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    {goal.name}
                                                </span>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    {goal.percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                                                    style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[10px] text-slate-500">{formatCurrency(goal.current)}</span>
                                                <span className="text-[10px] text-slate-500">{formatCurrency(goal.target)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Investments Summary */}
                        {reportPreview.investments && reportPreview.investments.length > 0 && (
                            <motion.div variants={itemVariants} className="card-clean p-5">
                                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Briefcase size={18} className="text-purple-500" />
                                    Portofolio Investasi
                                </h2>
                                <div className="space-y-3">
                                    {reportPreview.investments.slice(0, 5).map((investment) => (
                                        <div key={investment.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {investment.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                    {investment.type}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                                {formatCurrency(investment.value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* AI Insight */}
                        {reportPreview.aiInsight && (
                            <motion.div variants={itemVariants} className="card-clean p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-100 dark:border-purple-900/30">
                                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles size={18} className="text-purple-500" />
                                    AI Smart Advice
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {reportPreview.aiInsight}
                                </p>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <motion.div variants={itemVariants} className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Pilih periode dan generate laporan untuk melihat preview
                        </p>
                    </motion.div>
                )}

                {/* Download History */}
                <motion.div variants={itemVariants} className="card-clean p-5 pb-20 sm:pb-5">
                    <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-slate-500" />
                        Riwayat Download
                    </h2>
                    {historyError ? (
                        <ErrorEmpty
                            title="Gagal memuat riwayat"
                            description={historyError}
                            onRetry={() => { void loadReportHistory(); }}
                        />
                    ) : reportHistory.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                            Belum ada riwayat download
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {reportHistory.slice(0, 5).map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                            <FileDown size={18} className="text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {report.type}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {report.period} • {report.size}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {format(new Date(report.createdAt), "dd MMM yyyy", { locale: id })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}

// Skeleton Component
function ReportPreviewSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card-clean p-4">
                        <Skeleton className="w-20 h-3 mb-2" />
                        <Skeleton className="w-24 h-6" />
                    </div>
                ))}
            </div>
            <div className="card-clean p-5">
                <Skeleton className="w-32 h-4 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                            <Skeleton className="w-full h-2 mb-1" />
                            <Skeleton className="w-3/4 h-2" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="card-clean p-5">
                <Skeleton className="w-40 h-4 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="w-full h-12" />
                    ))}
                </div>
            </div>
        </div>
    );
}
