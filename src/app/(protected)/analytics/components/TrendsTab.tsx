"use client";

import { formatCurrency } from "@/frontend/lib/utils";
import { motion } from "framer-motion";
import { useSecurity } from "@/components/SecurityProvider";
import { MonthComparison } from "./MonthComparison";
import { SpendingHeatmap } from "./SpendingHeatmap";
import { AnalyticsData } from "./types";

export function TrendsTab({ data, itemVariants }: { data: AnalyticsData; itemVariants: any }) {
    const { isStealthMode } = useSecurity();
    // Get current and previous month from monthlyComparison
    const comparison = data.monthlyComparison || [];
    const currentMonth = comparison.length > 0 ? comparison[comparison.length - 1] : null;
    const previousMonth = comparison.length > 1 ? comparison[comparison.length - 2] : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Month Comparison */}
            {currentMonth && previousMonth && (
                <motion.div variants={itemVariants}>
                    <MonthComparison
                        currentIncome={currentMonth.income}
                        currentExpense={currentMonth.expense}
                        previousIncome={previousMonth.income}
                        previousExpense={previousMonth.expense}
                        currentMonthLabel={currentMonth.month}
                        previousMonthLabel={previousMonth.month}
                        hideBalance={isStealthMode}
                    />
                </motion.div>
            )}

            {/* Spending Heatmap */}
            <motion.div variants={itemVariants}>
                <SpendingHeatmap data={data.dailyStats} />
            </motion.div>

            {/* Top Categories */}
            <motion.div variants={itemVariants} className="card-clean p-6">
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Top Kategori Pengeluaran</h3>
                <div className="space-y-5">
                    {data.categoryBreakdown.expense.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{cat.name}</p>
                                    <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 dark:bg-slate-50 rounded-full"
                                            style={{ width: `${(cat.amount / data.expense) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground">
                                    {isStealthMode ? "******" : formatCurrency(cat.amount)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {Math.round((cat.amount / data.expense) * 100)}%
                                </p>
                            </div>
                        </div>
                    ))}
                    {data.categoryBreakdown.expense.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Belum ada data pengeluaran.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
