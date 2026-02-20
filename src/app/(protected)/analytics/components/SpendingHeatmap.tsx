"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

interface DailyStat {
    date: string;
    count: number;
    total: number;
}

interface SpendingHeatmapProps {
    data: DailyStat[];
    type?: "expense" | "amount";
}

/**
 * Spending Heatmap — shows which days of the week the user spends most.
 * Aggregates data by day-of-week to reveal spending patterns.
 */
export function SpendingHeatmap({ data }: SpendingHeatmapProps) {
    if (!data || data.length === 0) return null;

    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    data.forEach(d => {
        const dayOfWeek = new Date(d.date).getDay();
        dayTotals[dayOfWeek] += d.total;
        dayCounts[dayOfWeek] += d.count;
    });

    const maxTotal = Math.max(...dayTotals, 1);
    const totalSpending = dayTotals.reduce((a, b) => a + b, 0);

    const getIntensity = (value: number) => {
        const ratio = value / maxTotal;
        if (ratio === 0) return 0;
        if (ratio < 0.2) return 1;
        if (ratio < 0.4) return 2;
        if (ratio < 0.6) return 3;
        if (ratio < 0.8) return 4;
        return 5;
    };

    const colors = [
        "bg-slate-100 dark:bg-slate-800",
        "bg-rose-100 dark:bg-rose-900/30",
        "bg-rose-200 dark:bg-rose-800/50",
        "bg-rose-300 dark:bg-rose-700/60",
        "bg-rose-400 dark:bg-rose-600/70",
        "bg-rose-500 dark:bg-rose-500",
    ];

    // Find the highest spending day
    const maxDayIndex = dayTotals.indexOf(Math.max(...dayTotals));
    const minDayIndex = dayTotals.indexOf(Math.min(...dayTotals.filter(t => t > 0)));

    return (
        <div className="card-clean p-6">
            <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Pola Pengeluaran Mingguan
            </h3>

            <div className="space-y-3">
                {dayNames.map((day, i) => {
                    const intensity = getIntensity(dayTotals[i]);
                    const percentage = totalSpending > 0 ? Math.round((dayTotals[i] / totalSpending) * 100) : 0;

                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className={cn(
                                "text-xs font-bold w-14",
                                i === maxDayIndex ? "text-rose-600 dark:text-rose-400" :
                                    i === minDayIndex && dayTotals[i] > 0 ? "text-emerald-600 dark:text-emerald-400" :
                                        "text-muted-foreground"
                            )}>
                                {day}
                            </span>

                            <div className="flex-1 h-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(2, percentage)}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.08 }}
                                    className={cn("h-full rounded-lg", colors[intensity])}
                                />
                                {percentage > 15 && (
                                    <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-rose-900/70 dark:text-rose-100/80">
                                        {formatCurrency(dayTotals[i])}
                                    </span>
                                )}
                            </div>

                            <span className="text-[10px] font-bold text-muted-foreground w-8 text-right tabular-nums">
                                {percentage}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {maxDayIndex >= 0 && dayTotals[maxDayIndex] > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        💡 Kamu paling boros di <strong>{dayNames[maxDayIndex]}</strong> — coba review pengeluaran di hari itu!
                    </p>
                </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground">
                <span>Sedikit</span>
                <div className="flex gap-1">
                    {colors.map((c, i) => (
                        <div key={i} className={cn("w-3 h-3 rounded", c)} />
                    ))}
                </div>
                <span>Banyak</span>
            </div>
        </div>
    );
}
