"use client";

import { formatCurrency } from "@/frontend/lib/utils";
import { cn } from "@/frontend/lib/utils";
import { AlertTriangle } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useSecurity } from "@/components/SecurityProvider";
import { MonthComparison } from "./MonthComparison";
import { SpendingHeatmap } from "./SpendingHeatmap";
import { CategoryTrendChart } from "./CategoryTrendChart";
import type { AnalyticsData, AnalyticsDrilldownFilter } from "./types";

function EmptyTrendCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="card-clean p-6">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
    );
}

export function TrendsTab({
    data,
    itemVariants,
    periodLabel,
    onOpenDrilldown,
}: {
    data: AnalyticsData;
    itemVariants: Variants;
    periodLabel: string;
    onOpenDrilldown: (filter: AnalyticsDrilldownFilter) => void;
}) {
    const { isStealthMode } = useSecurity();
    // Get current and previous month from monthlyComparison
    const comparison = data.monthlyComparison || [];
    const currentMonth = comparison.length > 0 ? comparison[comparison.length - 1] : null;
    const previousMonth = comparison.length > 1 ? comparison[comparison.length - 2] : null;
    const anomalies = data.spendingPatterns?.anomalies || [];

    return (
        <div className="flex flex-col gap-6">
            {/* Month Comparison */}
            {currentMonth && previousMonth ? (
                <motion.div variants={itemVariants}>
                    <MonthComparison
                        currentIncome={currentMonth.income}
                        currentExpense={currentMonth.expense}
                        previousIncome={previousMonth.income}
                        previousExpense={previousMonth.expense}
                        currentMonthLabel={currentMonth.monthName || String(currentMonth.month)}
                        previousMonthLabel={previousMonth.monthName || String(previousMonth.month)}
                        hideBalance={isStealthMode}
                    />
                </motion.div>
            ) : (
                <EmptyTrendCard
                    title="Perbandingan Bulan"
                    description="Belum cukup histori untuk membandingkan bulan berjalan dengan bulan sebelumnya."
                />
            )}

            {/* Spending Pattern */}
            <motion.div variants={itemVariants} className="space-y-3">
                <div>
                    <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                        Pola Pengeluaran
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">{periodLabel}</p>
                </div>

                {data.dailyStats.length === 0 ? (
                    <EmptyTrendCard
                        title="Pola Pengeluaran"
                        description={`Belum ada transaksi pengeluaran untuk ${periodLabel}.`}
                    />
                ) : (
                    <SpendingHeatmap data={data.dailyStats} />
                )}
            </motion.div>

            <div>
                <motion.div variants={itemVariants} className="card-clean p-5">
                    <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                            Anomali Pengeluaran
                        </h3>
                    </div>
                    {anomalies.length > 0 ? (
                        <div className="space-y-3">
                            {anomalies.slice(0, 2).map((anomaly) => (
                                <button
                                    key={anomaly.date}
                                    onClick={() => onOpenDrilldown({
                                        title: "Transaksi Anomali",
                                        description: `Daftar transaksi pada ${new Date(anomaly.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
                                        startDate: anomaly.date,
                                        endDate: anomaly.date,
                                        type: "expense",
                                    })}
                                    className="w-full rounded-2xl bg-amber-50 p-3 text-left text-amber-800 transition-colors hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-bold">
                                            {new Date(anomaly.date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                                        </p>
                                        <span className={cn(
                                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                            anomaly.severity === "high" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                                            anomaly.severity === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                                            (!anomaly.severity || anomaly.severity === "low") && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                        )}>
                                            {anomaly.severity || "low"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px]">
                                        Pengeluaran {formatCurrency(anomaly.totalAmount)} dari {anomaly.transactionCount} transaksi.
                                    </p>
                                    {anomaly.insight && (
                                        <p className="mt-1 text-[11px] opacity-90">{anomaly.insight}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Belum ada lonjakan pengeluaran yang menonjol untuk {periodLabel}.
                        </p>
                    )}
                </motion.div>

            </div>

            <motion.div variants={itemVariants}>
                <CategoryTrendChart />
            </motion.div>

            {/* Top Categories */}
            <motion.div variants={itemVariants} className="card-clean p-6">
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Top Kategori Pengeluaran</h3>
                <div className="space-y-5">
                    {data.categoryBreakdown.expense.map((cat, idx) => (
                        <button
                            key={idx}
                            onClick={() => onOpenDrilldown({
                                title: `Kategori ${cat.name}`,
                                description: `Transaksi pengeluaran untuk kategori ${cat.name}`,
                                categoryId: data.categoryStats?.find((item) => item.categoryName === cat.name)?.categoryId,
                                type: "expense",
                            })}
                            className="flex w-full items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{cat.name}</p>
                                    <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 dark:bg-slate-50 rounded-full"
                                            style={{ width: `${data.expense > 0 ? (cat.amount / data.expense) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground">
                                    {isStealthMode ? "******" : formatCurrency(cat.amount)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {Math.round(data.expense > 0 ? (cat.amount / data.expense) * 100 : 0)}%
                                </p>
                            </div>
                        </button>
                    ))}
                    {data.categoryBreakdown.expense.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Belum ada data pengeluaran untuk {periodLabel}.
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
