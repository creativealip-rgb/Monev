"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Brain, Sparkles, Lock, ChevronRight, RefreshCw, ListTodo } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useSecurity } from "@/components/SecurityProvider";
import type { AnalyticsData, AnalyticsDrilldownFilter } from "./types";

function CashflowPredictionCard({ data, hideValue, itemVariants }: { data: AnalyticsData; hideValue: boolean; itemVariants: Variants }) {
    return (
        <motion.div variants={itemVariants} className="card-clean p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Prediksi Cashflow</h3>
                    <p className="text-xs text-muted-foreground mt-1">Estimasi saldo akhir bulan depan</p>
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-foreground">
                    {hideValue ? "******" : formatCurrency(data.cashflowPrediction.nextMonth)}
                </span>
                {data.cashflowPrediction.trend === "up" && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Naik ↗</span>}
                {data.cashflowPrediction.trend === "down" && <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">Turun ↘</span>}
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-slate-900 dark:bg-slate-400 rounded-full"
                        style={{ width: `${data.cashflowPrediction.confidence}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{data.cashflowPrediction.confidence}% confidence</span>
            </div>
        </motion.div>
    );
}

function buildActionItems(data: AnalyticsData) {
    const actions: string[] = [];
    const primaryAnomaly = data.spendingPatterns?.anomalies?.[0];

    if (primaryAnomaly) {
        actions.push(
            `Cek pengeluaran tanggal ${new Date(primaryAnomaly.date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} karena nilainya ${formatCurrency(primaryAnomaly.totalAmount)} dan berada di atas pola normal.`
        );
    }

    if (data.budgetAlerts.length > 0) {
        actions.push(`Review budget kategori ${data.budgetAlerts[0].category} karena sudah mendekati atau melewati limit.`);
    }

    if (data.expense > data.income * 0.8) {
        actions.push("Tahan pengeluaran non-esensial sampai rasio pengeluaran kembali di bawah 80% pemasukan.");
    }

    if ((data.summary?.savingsRate || 0) < 20) {
        actions.push("Sisihkan dana tabungan otomatis minggu ini agar target 20% tabungan tetap terjaga.");
    }

    const topCategory = data.categoryStats?.[0];
    if (topCategory) {
        actions.push(`Audit transaksi di kategori ${topCategory.categoryName} karena itu pos pengeluaran terbesar saat ini.`);
    }

    return actions.slice(0, 3);
}

export function getAnalyticsActionItems(data: AnalyticsData) {
    return buildActionItems(data);
}

function buildActionDrilldown(
    action: string,
    data: AnalyticsData,
    baseFilter: Partial<AnalyticsDrilldownFilter>
): AnalyticsDrilldownFilter | null {
    const primaryAnomaly = data.spendingPatterns?.anomalies?.[0];
    const primaryBudgetAlert = data.budgetAlerts?.[0];
    const topCategory = data.categoryStats?.[0];

    if (primaryAnomaly && action.includes("Cek pengeluaran tanggal")) {
        return {
            title: "Transaksi Anomali",
            description: "Daftar transaksi pada hari dengan lonjakan pengeluaran paling menonjol.",
            type: "expense",
            startDate: primaryAnomaly.date,
            endDate: primaryAnomaly.date,
            ...baseFilter,
        };
    }

    if (primaryBudgetAlert && action.includes("Review budget kategori")) {
        return {
            title: `Budget Alert: ${primaryBudgetAlert.category}`,
            description: `Daftar transaksi pengeluaran kategori ${primaryBudgetAlert.category}.`,
            type: "expense",
            categoryId: topCategory?.categoryName === primaryBudgetAlert.category ? topCategory.categoryId : data.categoryStats?.find(
                (category) => category.categoryName === primaryBudgetAlert.category
            )?.categoryId,
            ...baseFilter,
        };
    }

    if (topCategory && action.includes("Audit transaksi di kategori")) {
        return {
            title: `Kategori ${topCategory.categoryName}`,
            description: `Daftar transaksi pengeluaran kategori ${topCategory.categoryName}.`,
            type: "expense",
            categoryId: topCategory.categoryId,
            ...baseFilter,
        };
    }

    if (action.includes("Tahan pengeluaran non-esensial")) {
        return {
            title: "Pengeluaran Non-Esensial",
            description: "Daftar pengeluaran pada periode aktif untuk ditinjau ulang.",
            type: "expense",
            ...baseFilter,
        };
    }

    return null;
}

export function InsightsTab({
    data,
    itemVariants,
    periodLabel,
    onOpenDrilldown,
    baseFilter,
}: {
    data: AnalyticsData;
    itemVariants: Variants;
    periodLabel: string;
    onOpenDrilldown: (filter: AnalyticsDrilldownFilter) => void;
    baseFilter: Partial<AnalyticsDrilldownFilter>;
}) {
    const { isStealthMode } = useSecurity();
    const [insightText, setInsightText] = useState(data.insights);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const actionItems = buildActionItems(data);

    async function fetchInsight(forceRefresh = false) {
        setIsLoadingInsight(true);

        try {
            const response = await apiFetch(forceRefresh ? "/api/ai/insight?refresh=true" : "/api/ai/insight");
            const payload = await response.json();

            if (response.ok && payload?.success && payload?.insight) {
                setInsightText(payload.insight);
            } else {
                setInsightText("Belum ada insight yang cukup untuk dianalisis.");
            }
        } catch (error) {
            console.error("Failed to fetch AI insight:", error);
            setInsightText("Gagal memuat insight AI. Coba lagi sebentar lagi.");
        } finally {
            setIsLoadingInsight(false);
        }
    }

    useEffect(() => {
        setInsightText(data.insights);
    }, [data.insights]);

    useEffect(() => {
        if (!data.canAccessAIInsights || insightText) {
            return;
        }

        fetchInsight();
    }, [data.canAccessAIInsights, insightText]);

    if (!data.canAccessAIInsights) {
        return (
            <div className="flex flex-col gap-6">
                <motion.div variants={itemVariants} className="card-clean p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock size={18} className="text-slate-400" />
                            <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Financial Insights</h3>
                        </div>
                        <Link
                            href="/fitur/upgrade"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                            Upgrade <ChevronRight size={12} />
                        </Link>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        Dapatkan analisa AI personal tentang keuanganmu dengan upgrade ke paket Kaya atau Sultan.
                    </p>
                </motion.div>

                <CashflowPredictionCard data={data} hideValue={isStealthMode} itemVariants={itemVariants} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <motion.div variants={itemVariants} className="card-clean p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-100 dark:border-indigo-800/30">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <Brain className="text-indigo-500" size={18} />
                            <h3 className="text-[13px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">AI Financial Insights</h3>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            Analisa untuk periode {periodLabel}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchInsight(true)}
                        disabled={isLoadingInsight}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 px-3 py-1.5 text-[11px] font-bold text-indigo-600 transition-all hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                    >
                        <RefreshCw size={12} className={cn(isLoadingInsight && "animate-spin")} />
                        Refresh
                    </button>
                </div>
                <div className="space-y-3">
                    {isLoadingInsight && !insightText ? (
                        <p className="text-xs text-slate-500">Sedang menyiapkan insight AI...</p>
                    ) : insightText ? (
                        <div className="flex gap-3 items-start">
                            <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{insightText}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Belum ada insight yang cukup untuk dianalisis.</p>
                    )}
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card-clean p-6">
                <div className="mb-4 flex items-center gap-2">
                    <ListTodo size={16} className="text-emerald-500" />
                    <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                        Aksi Minggu Ini
                    </h3>
                </div>
                {actionItems.length > 0 ? (
                    <div className="space-y-3">
                        {actionItems.map((action) => (
                            <button
                                key={action}
                                type="button"
                                onClick={() => {
                                    const drilldown = buildActionDrilldown(action, data, baseFilter);
                                    if (drilldown) {
                                        onOpenDrilldown(drilldown);
                                    }
                                }}
                                className="w-full rounded-2xl bg-emerald-50 px-4 py-3 text-left text-[12px] text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Belum ada tindakan mendesak untuk periode {periodLabel}. Pertahankan ritme keuangan yang sekarang.
                    </p>
                )}
            </motion.div>

            <CashflowPredictionCard data={data} hideValue={isStealthMode} itemVariants={itemVariants} />
        </div>
    );
}
