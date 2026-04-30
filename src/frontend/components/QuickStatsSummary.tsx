"use client";

import { motion } from "framer-motion";
import { Calendar, Flame, Target, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";

interface QuickStatsSummaryProps {
    todayIncome: number;
    todayExpense: number;
    todayTransactionCount: number;
    weeklyBudgetRemaining: number;
    weeklyBudgetTotal: number;
    currentStreak: number;
    longestStreak: number;
    mounted: boolean;
    isStealthMode: boolean;
}

type StatTone = "sky" | "emerald" | "rose" | "orange" | "violet";

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    helper: string;
    tone: StatTone;
    delay: number;
    hideValue?: boolean;
}

const toneClasses = {
    sky: "border-sky-100 bg-white text-sky-600 shadow-sky-100/70 dark:border-sky-900/40 dark:bg-slate-900 dark:text-sky-300",
    emerald: "border-emerald-100 bg-white text-emerald-600 shadow-emerald-100/70 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-emerald-300",
    rose: "border-rose-100 bg-white text-rose-600 shadow-rose-100/70 dark:border-rose-900/40 dark:bg-slate-900 dark:text-rose-300",
    orange: "border-orange-100 bg-white text-orange-600 shadow-orange-100/70 dark:border-orange-900/40 dark:bg-slate-900 dark:text-orange-300",
    violet: "border-violet-100 bg-white text-violet-600 shadow-violet-100/70 dark:border-violet-900/40 dark:bg-slate-900 dark:text-violet-300",
};

const iconToneClasses = {
    sky: "bg-sky-50 dark:bg-sky-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30",
    rose: "bg-rose-50 dark:bg-rose-900/30",
    orange: "bg-orange-50 dark:bg-orange-900/30",
    violet: "bg-violet-50 dark:bg-violet-900/30",
};

function StatCard({ icon: Icon, label, value, helper, tone, delay, hideValue }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cn(
                "relative min-w-0 overflow-hidden rounded-2xl border p-2.5 shadow-sm sm:p-3",
                toneClasses[tone]
            )}
        >
            <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-xl", iconToneClasses[tone])}>
                <Icon size={16} />
            </div>
            <p className="mb-1 line-clamp-2 min-h-[28px] text-[10px] font-bold leading-tight text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <p className="truncate text-sm font-black tracking-tight tabular-nums sm:text-base">
                {hideValue ? "******" : value}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {helper}
            </p>
        </motion.div>
    );
}

export function QuickStatsSummary({
    todayIncome,
    todayExpense,
    todayTransactionCount,
    weeklyBudgetRemaining,
    weeklyBudgetTotal,
    currentStreak,
    longestStreak,
    mounted,
    isStealthMode,
}: QuickStatsSummaryProps) {
    const todayNet = todayIncome - todayExpense;
    const budgetPercentage = weeklyBudgetTotal > 0
        ? Math.round((weeklyBudgetRemaining / weeklyBudgetTotal) * 100)
        : 0;
    const dateLabel = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const budgetTone: StatTone = budgetPercentage < 20 ? "rose" : budgetPercentage > 50 ? "emerald" : "orange";
    const netTone: StatTone = todayNet > 0 ? "emerald" : todayNet < 0 ? "rose" : "sky";
    const streakHelper = currentStreak > 0
        ? `${longestStreak} hari rekor terbaik`
        : "Mulai hari ini";

    return (
        <section className="px-4 mb-4 sm:px-6 sm:mb-6">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.18em]">
                    Ringkasan Hari Ini
                </h2>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
                    <Calendar size={12} />
                    {dateLabel}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <StatCard
                    icon={Wallet}
                    label={`${todayTransactionCount} Transaksi`}
                    value={mounted ? formatCurrency(todayNet).replace("Rp", "Rp ") : "..."}
                    helper={todayNet === 0 ? "Belum ada net" : `${todayNet > 0 ? "+" : ""}${formatCurrency(todayNet).replace("Rp", "").trim()} net`}
                    tone={netTone}
                    delay={0.05}
                    hideValue={isStealthMode}
                />
                <StatCard
                    icon={Target}
                    label="Sisa Budget"
                    value={mounted ? formatCurrency(weeklyBudgetRemaining).replace("Rp", "Rp ") : "..."}
                    helper={`${budgetPercentage}% tersisa minggu ini`}
                    tone={budgetTone}
                    delay={0.1}
                    hideValue={isStealthMode}
                />
                <StatCard
                    icon={Flame}
                    label="Streak Hari Ini"
                    value={`${currentStreak} Hari`}
                    helper={streakHelper}
                    tone={currentStreak > 0 ? "orange" : "violet"}
                    delay={0.15}
                />
            </div>
        </section>
    );
}
