"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Brain, Sparkles, RefreshCw, ListTodo, Target, PiggyBank, ShieldAlert, CalendarClock, AlertTriangle } from "lucide-react";
import { motion, type Variants } from "framer-motion";
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

function buildPriorityInsight(data: AnalyticsData) {
    const budgetAlert = [...data.budgetAlerts].sort((a, b) => b.percentage - a.percentage)[0];
    const topCategory = data.categoryStats?.[0];
    const savingsRate = data.summary?.savingsRate ?? 0;
    const expenseRatio = data.income > 0 ? (data.expense / data.income) * 100 : 0;

    if (budgetAlert && budgetAlert.percentage >= 90) {
        return {
            title: "Budget paling rawan",
            value: budgetAlert.category,
            detail: `Sudah ${Math.round(budgetAlert.percentage)}% dari limit. Rem kategori ini dulu.`,
            tone: "rose" as const,
        };
    }

    if (expenseRatio >= 80) {
        return {
            title: "Cashflow mulai ketat",
            value: `${Math.round(expenseRatio)}% pemasukan terpakai`,
            detail: "Kurangi pos fleksibel minggu ini supaya saldo akhir bulan tetap aman.",
            tone: "amber" as const,
        };
    }

    if (savingsRate < 20) {
        return {
            title: "Tabungan belum ideal",
            value: `${Math.round(savingsRate)}% savings rate`,
            detail: "Target sehat minimal 20%. Sisihkan otomatis setelah gajian berikutnya.",
            tone: "amber" as const,
        };
    }

    return {
        title: "Fokus terbesar",
        value: topCategory?.categoryName || "Ritme masih aman",
        detail: topCategory ? `Pos ini menyerap ${formatCurrency(topCategory.total)} pada periode aktif.` : "Belum ada sinyal risiko besar dari data periode ini.",
        tone: "emerald" as const,
    };
}

function buildSavingsOpportunity(data: AnalyticsData) {
    const topCategory = data.categoryStats?.[0];
    if (!topCategory) {
        return {
            title: "Potensi hemat",
            value: "Belum terbaca",
            detail: "Tambahkan transaksi agar peluang hemat bisa dihitung.",
        };
    }

    const potential = Math.round(topCategory.total * 0.12);
    return {
        title: "Potensi hemat realistis",
        value: formatCurrency(potential),
        detail: `Turunkan 12% dari ${topCategory.categoryName} untuk ruang tabungan tambahan.`,
    };
}

function getBudgetRiskItems(data: AnalyticsData) {
    return [...data.budgetAlerts]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);
}

function buildCashflowSafety(data: AnalyticsData) {
    const balance = data.totalAccounts ?? data.balance ?? 0;
    const avgDailySpending = data.spendingPatterns?.averageDailySpending || data.summary?.avgDailySpending || 0;
    const runwayDays = avgDailySpending > 0 ? Math.floor(balance / avgDailySpending) : null;
    const dailyRoom = data.income > data.expense ? Math.floor((data.income - data.expense) / 30) : 0;

    if (runwayDays === null) {
        return {
            title: "Cashflow safety",
            value: "Belum terbaca",
            detail: "Butuh pola pengeluaran harian untuk menghitung daya tahan saldo.",
            tone: "slate" as const,
        };
    }

    return {
        title: "Cashflow safety",
        value: `${runwayDays} hari aman`,
        detail: dailyRoom > 0
            ? `Ruang belanja aman sekitar ${formatCurrency(dailyRoom)}/hari.`
            : "Pengeluaran sudah menekan pemasukan. Kurangi pos fleksibel dulu.",
        tone: runwayDays < 14 ? "rose" as const : runwayDays < 30 ? "amber" as const : "emerald" as const,
    };
}

function buildAnomalyInsight(data: AnalyticsData) {
    const anomaly = data.spendingPatterns?.anomalies?.[0] || data.spendingPatterns?.highestSpendingDay;
    if (!anomaly) {
        return {
            title: "Lonjakan",
            value: "Normal",
            detail: "Belum ada hari yang terlihat jauh di atas pola biasa.",
            date: undefined,
        };
    }

    return {
        title: "Lonjakan terdeteksi",
        value: formatCurrency(anomaly.totalAmount),
        detail: `${new Date(anomaly.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} punya ${anomaly.transactionCount} transaksi. Cek apakah ini kebutuhan rutin atau bocor halus.`,
        date: anomaly.date,
    };
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

function normalizeInsightText(value: unknown) {
    if (!value) return "";
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object" && "insight" in parsed) {
                return String((parsed as { insight?: unknown }).insight || "");
            }
        } catch {
            return value;
        }
        return value;
    }
    if (typeof value === "object" && "insight" in value) {
        return String((value as { insight?: unknown }).insight || "");
    }
    return String(value);
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
    const canAccessAIInsights = data.canAccessAIInsights;
    const [insightText, setInsightText] = useState(() => normalizeInsightText(data.insights));
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const actionItems = buildActionItems(data);
    const priorityInsight = buildPriorityInsight(data);
    const savingsOpportunity = buildSavingsOpportunity(data);
    const budgetRiskItems = getBudgetRiskItems(data);
    const cashflowSafety = buildCashflowSafety(data);
    const anomalyInsight = buildAnomalyInsight(data);

    const fetchInsight = useCallback(async (forceRefresh = false) => {
        if (!canAccessAIInsights) return;
        setIsLoadingInsight(true);

        try {
            const response = await apiFetch(forceRefresh ? "/api/ai/insight?refresh=true" : "/api/ai/insight");
            const payload = await response.json();

            if (response.ok && payload?.success && payload?.insight) {
                setInsightText(normalizeInsightText(payload.insight));
            } else {
                setInsightText("Belum ada insight yang cukup untuk dianalisis.");
            }
        } catch (error) {
            console.error("Failed to fetch AI insight:", error);
            setInsightText("Gagal memuat insight AI. Coba lagi sebentar lagi.");
        } finally {
            setIsLoadingInsight(false);
        }
    }, [canAccessAIInsights]);

    useEffect(() => {
        setInsightText(canAccessAIInsights ? normalizeInsightText(data.insights) : "");
    }, [canAccessAIInsights, data.insights]);

    useEffect(() => {
        if (!canAccessAIInsights || insightText) {
            return;
        }

        fetchInsight();
    }, [canAccessAIInsights, fetchInsight, insightText]);

    return (
        <div className="flex flex-col gap-6">
            <motion.div variants={itemVariants} className="grid gap-3 md:grid-cols-3">
                <div className={cn(
                    "rounded-[1.35rem] border p-4 shadow-sm",
                    priorityInsight.tone === "rose" && "border-rose-100 bg-rose-50/70 dark:border-rose-950/40 dark:bg-rose-950/20",
                    priorityInsight.tone === "amber" && "border-amber-100 bg-amber-50/70 dark:border-amber-950/40 dark:bg-amber-950/20",
                    priorityInsight.tone === "emerald" && "border-emerald-100 bg-emerald-50/70 dark:border-emerald-950/40 dark:bg-emerald-950/20"
                )}>
                    <Target size={15} className="mb-3 text-slate-700 dark:text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Prioritas</p>
                    <p className="mt-1 text-sm font-black text-foreground">{priorityInsight.value}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">{priorityInsight.detail}</p>
                </div>

                <div className="rounded-[1.35rem] border border-sky-100 bg-sky-50/70 p-4 shadow-sm dark:border-sky-950/40 dark:bg-sky-950/20">
                    <PiggyBank size={15} className="mb-3 text-sky-600 dark:text-sky-300" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{savingsOpportunity.title}</p>
                    <p className="mt-1 text-sm font-black text-foreground">{savingsOpportunity.value}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">{savingsOpportunity.detail}</p>
                </div>

                <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <ShieldAlert size={15} className="mb-3 text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Budget Risk</p>
                    {budgetRiskItems.length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {budgetRiskItems.map((item) => (
                                <div key={item.category}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold">
                                        <span className="truncate text-foreground">{item.category}</span>
                                        <span className="text-muted-foreground">{Math.round(item.percentage)}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className={cn("h-full rounded-full", item.percentage >= 90 ? "bg-rose-500" : "bg-amber-400")}
                                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-300">Aman</p>
                    )}
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-3 md:grid-cols-2">
                <div className={cn(
                    "rounded-[1.35rem] border p-4 shadow-sm",
                    cashflowSafety.tone === "rose" && "border-rose-100 bg-rose-50/70 dark:border-rose-950/40 dark:bg-rose-950/20",
                    cashflowSafety.tone === "amber" && "border-amber-100 bg-amber-50/70 dark:border-amber-950/40 dark:bg-amber-950/20",
                    cashflowSafety.tone === "emerald" && "border-emerald-100 bg-emerald-50/70 dark:border-emerald-950/40 dark:bg-emerald-950/20",
                    cashflowSafety.tone === "slate" && "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                )}>
                    <div className="mb-3 flex items-center gap-2">
                        <CalendarClock size={15} className="text-slate-700 dark:text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{cashflowSafety.title}</p>
                    </div>
                    <p className="text-lg font-black text-foreground">{cashflowSafety.value}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">{cashflowSafety.detail}</p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (!anomalyInsight.date) return;
                        onOpenDrilldown({
                            title: "Lonjakan Pengeluaran",
                            description: "Daftar transaksi pada hari dengan lonjakan paling menonjol.",
                            type: "expense",
                            startDate: anomalyInsight.date,
                            endDate: anomalyInsight.date,
                            ...baseFilter,
                        });
                    }}
                    className="rounded-[1.35rem] border border-orange-100 bg-orange-50/70 p-4 text-left shadow-sm transition-colors hover:bg-orange-100/70 disabled:cursor-default disabled:hover:bg-orange-50/70 dark:border-orange-950/40 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
                    disabled={!anomalyInsight.date}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle size={15} className="text-orange-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{anomalyInsight.title}</p>
                    </div>
                    <p className="text-lg font-black text-foreground">{anomalyInsight.value}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">{anomalyInsight.detail}</p>
                </button>
            </motion.div>

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
                    {canAccessAIInsights ? (
                        <button
                            onClick={() => fetchInsight(true)}
                            disabled={isLoadingInsight}
                            className="inline-flex items-center gap-1 rounded-full border border-indigo-200 px-3 py-1.5 text-[11px] font-bold text-indigo-600 transition-all hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                        >
                            <RefreshCw size={12} className={cn(isLoadingInsight && "animate-spin")} />
                            Refresh
                        </button>
                    ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                            Hasil disensor
                        </span>
                    )}
                </div>
                <div className="space-y-3">
                    {!canAccessAIInsights ? (
                        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/70 p-4 dark:border-indigo-900/40 dark:bg-slate-900/60">
                            <div className="space-y-2 blur-sm select-none">
                                <div className="h-3 w-11/12 rounded-full bg-indigo-200/80 dark:bg-indigo-900/50" />
                                <div className="h-3 w-4/5 rounded-full bg-indigo-200/70 dark:bg-indigo-900/40" />
                                <div className="h-3 w-2/3 rounded-full bg-indigo-200/60 dark:bg-indigo-900/30" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-white/45 px-6 text-center backdrop-blur-[2px] dark:bg-slate-950/35">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Wawasan bisa dibuka di Free, tapi detail hasil AI disensor. Upgrade untuk melihat analisa lengkap.
                                </p>
                            </div>
                        </div>
                    ) : isLoadingInsight && !insightText ? (
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
