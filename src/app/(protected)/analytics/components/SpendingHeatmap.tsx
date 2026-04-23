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

export function MonthlySpendingHeatmap({ data }: { data: DailyStat[] }) {
    if (!data || data.length === 0) return null;

    const firstDate = new Date(data[0].date);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = firstDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
    });

    const dataMap = new Map(data.map((item) => [item.date, item]));
    const maxTotal = Math.max(...data.map((item) => item.total || 0), 1);
    const firstDayOffset = new Date(year, month, 1).getDay();

    const getColor = (total: number) => {
        const ratio = total / maxTotal;

        if (ratio === 0) return "bg-slate-100 dark:bg-slate-800";
        if (ratio < 0.2) return "bg-emerald-100 dark:bg-emerald-900/30";
        if (ratio < 0.4) return "bg-emerald-200 dark:bg-emerald-800/40";
        if (ratio < 0.6) return "bg-emerald-300 dark:bg-emerald-700/55";
        if (ratio < 0.8) return "bg-emerald-400 dark:bg-emerald-600/70";
        return "bg-emerald-500 dark:bg-emerald-500";
    };

    const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        const dateKey = date.toISOString().split("T")[0];
        const stats = dataMap.get(dateKey) || { count: 0, total: 0 };

        return {
            dateKey,
            dayNumber: index + 1,
            ...stats,
        };
    });

    const highestDay = calendarDays.reduce((max, current) => (
        current.total > max.total ? current : max
    ), calendarDays[0]);

    return (
        <div className="card-clean p-6">
            <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Pola Pengeluaran Bulanan
            </h3>
            <p className="mb-4 text-[10px] text-muted-foreground uppercase tracking-wider">
                {monthLabel}
            </p>

            <div className="grid grid-cols-7 gap-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                    <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}

                {Array.from({ length: firstDayOffset }).map((_, index) => (
                    <div key={`empty-${index}`} />
                ))}

                {calendarDays.map((day) => (
                    <motion.div
                        key={day.dateKey}
                        whileHover={{ scale: 1.08 }}
                        className="group relative"
                    >
                        <div
                            className={cn(
                                "aspect-square rounded-lg border border-white/70 dark:border-slate-900/40",
                                "flex items-center justify-center shadow-sm",
                                getColor(day.total)
                            )}
                        >
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-100">
                                {day.dayNumber}
                            </span>
                        </div>

                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                            <p>{formatCurrency(day.total)}</p>
                            <p>{day.count} transaksi</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {highestDay.total > 0 && (
                <div className="mt-4 rounded-xl bg-emerald-50/60 p-3 text-[11px] text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-300">
                    Pengeluaran harian tertinggi terjadi pada tanggal <strong>{highestDay.dayNumber}</strong> dengan total{" "}
                    <strong>{formatCurrency(highestDay.total)}</strong>.
                </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                <span>Sedikit</span>
                <div className="flex gap-1">
                    {[
                        "bg-slate-100 dark:bg-slate-800",
                        "bg-emerald-100 dark:bg-emerald-900/30",
                        "bg-emerald-200 dark:bg-emerald-800/40",
                        "bg-emerald-300 dark:bg-emerald-700/55",
                        "bg-emerald-400 dark:bg-emerald-600/70",
                        "bg-emerald-500 dark:bg-emerald-500",
                    ].map((colorClass) => (
                        <div key={colorClass} className={cn("h-3 w-3 rounded", colorClass)} />
                    ))}
                </div>
                <span>Banyak</span>
            </div>
        </div>
    );
}
