"use client";

import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthComparisonProps {
    currentIncome: number;
    currentExpense: number;
    previousIncome: number;
    previousExpense: number;
    currentMonthLabel: string;
    previousMonthLabel: string;
    hideBalance?: boolean;
}

function getChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

function TrendBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = value === 0;
    const absValue = Math.abs(value);

    return (
        <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
            isNeutral ? "bg-slate-100 dark:bg-slate-800 text-muted-foreground" :
                isPositive ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                    "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
        )}>
            {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {absValue}%
        </span>
    );
}

export function MonthComparison({
    currentIncome,
    currentExpense,
    previousIncome,
    previousExpense,
    currentMonthLabel,
    previousMonthLabel,
    hideBalance = false,
}: MonthComparisonProps) {
    const incomeChange = getChangePercent(currentIncome, previousIncome);
    const expenseChange = getChangePercent(currentExpense, previousExpense);
    const currentSavings = currentIncome - currentExpense;
    const previousSavings = previousIncome - previousExpense;
    const savingsChange = getChangePercent(currentSavings, previousSavings);

    const bars = [
        {
            label: "Pemasukan",
            current: currentIncome,
            previous: previousIncome,
            change: incomeChange,
            color: "bg-emerald-500",
            previousColor: "bg-emerald-200 dark:bg-emerald-800",
        },
        {
            label: "Pengeluaran",
            current: currentExpense,
            previous: previousExpense,
            change: expenseChange,
            inverse: true,
            color: "bg-rose-500",
            previousColor: "bg-rose-200 dark:bg-rose-800",
        },
        {
            label: "Tabungan Bersih",
            current: currentSavings,
            previous: previousSavings,
            change: savingsChange,
            color: "bg-sky-500",
            previousColor: "bg-sky-200 dark:bg-sky-800",
        },
    ];

    const maxValue = Math.max(
        currentIncome, previousIncome,
        currentExpense, previousExpense,
        Math.abs(currentSavings), Math.abs(previousSavings),
        1
    );

    return (
        <div className="card-clean p-6">
            <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Perbandingan Bulan
            </h3>
            <p className="text-[10px] text-muted-foreground mb-5">
                {currentMonthLabel} vs {previousMonthLabel}
            </p>

            <div className="space-y-5">
                {bars.map((bar, i) => (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">{bar.label}</span>
                            <TrendBadge value={bar.change} inverse={bar.inverse} />
                        </div>

                        {/* Current month */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">{currentMonthLabel}</span>
                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, (Math.abs(bar.current) / maxValue) * 100)}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.15 }}
                                    className={cn("h-full rounded-full", bar.color)}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-foreground w-20 text-right tabular-nums">
                                {hideBalance ? "******" : formatCurrency(Math.abs(bar.current))}
                            </span>
                        </div>

                        {/* Previous month */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-16 text-right">{previousMonthLabel}</span>
                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, (Math.abs(bar.previous) / maxValue) * 100)}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.15 + 0.1 }}
                                    className={cn("h-full rounded-full", bar.previousColor)}
                                />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-20 text-right tabular-nums">
                                {hideBalance ? "******" : formatCurrency(Math.abs(bar.previous))}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
