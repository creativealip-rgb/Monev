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
    ChevronLeft,
    ChevronRight,
    Loader2,
    FileSpreadsheet,
    FileText,
} from "lucide-react";
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

export function ReportsModal({ onClose }: { onClose: () => void }) {
    const toast = useToast();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState<ReportType>("monthly");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

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

    useEffect(() => {
        loadReportHistory();
    }, []);

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

    return (
        <motion.div
            className="space-y-5 sm:space-y-6"
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

                {/* Download History */}
                <motion.div variants={itemVariants} className="card-clean p-5">
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
    );
}


