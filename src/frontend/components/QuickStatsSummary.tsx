"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, Flame, Calendar, Wallet } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

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

function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    subValue, 
    trend,
    trendValue,
    color,
    mounted,
    isStealthMode
}: { 
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    color: string;
    mounted: boolean;
    isStealthMode: boolean;
}) {
    const colorClasses: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-200 dark:border-emerald-800",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30"
        },
        rose: {
            bg: "bg-rose-50 dark:bg-rose-900/20",
            text: "text-rose-600 dark:text-rose-400",
            border: "border-rose-200 dark:border-rose-800",
            iconBg: "bg-rose-100 dark:bg-rose-900/30"
        },
        sky: {
            bg: "bg-sky-50 dark:bg-sky-900/20",
            text: "text-sky-600 dark:text-sky-400",
            border: "border-sky-200 dark:border-sky-800",
            iconBg: "bg-sky-100 dark:bg-sky-900/30"
        },
        orange: {
            bg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-600 dark:text-orange-400",
            border: "border-orange-200 dark:border-orange-800",
            iconBg: "bg-orange-100 dark:bg-orange-900/30"
        },
        violet: {
            bg: "bg-violet-50 dark:bg-violet-900/20",
            text: "text-violet-600 dark:text-violet-400",
            border: "border-violet-200 dark:border-violet-800",
            iconBg: "bg-violet-100 dark:bg-violet-900/30"
        }
    };

    const colors = colorClasses[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                "relative overflow-hidden rounded-2xl p-4 border min-w-[160px] flex-shrink-0",
                "bg-white dark:bg-slate-900",
                colors.border,
                "hover:shadow-lg transition-shadow"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.iconBg)}>
                    <Icon size={20} className={colors.text} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                        trend === "up" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                        trend === "down" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}>
                        {trend === "up" && <TrendingUp size={12} />}
                        {trend === "down" && <TrendingDown size={12} />}
                        {trendValue}
                    </div>
                )}
            </div>

            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {label}
                </p>
                <p className={cn(
                    "text-xl font-black tracking-tight",
                    !mounted && "text-slate-300 dark:text-slate-700 animate-pulse",
                    colors.text
                )}>
                    {!mounted ? "..." : isStealthMode ? "******" : value}
                </p>
                {subValue && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {subValue}
                    </p>
                )}
            </div>
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
    isStealthMode
}: QuickStatsSummaryProps) {
    const budgetPercentage = weeklyBudgetTotal > 0 
        ? Math.round((weeklyBudgetRemaining / weeklyBudgetTotal) * 100) 
        : 0;

    return (
        <section className="px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Ringkasan Hari Ini
                </h2>
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                        {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {/* Today's Transactions */}
                <StatCard
                    icon={Wallet}
                    label={`${todayTransactionCount} Transaksi`}
                    value={formatCurrency(todayIncome - todayExpense).replace("Rp", "Rp ")}
                    subValue={`${todayIncome > todayExpense ? "+" : ""}${formatCurrency(todayIncome - todayExpense).replace("Rp", "").trim()} net`}
                    trend={todayIncome > todayExpense ? "up" : todayExpense > todayIncome ? "down" : "neutral"}
                    trendValue={`${todayIncome > todayExpense ? "+" : ""}${Math.abs(todayIncome - todayExpense) > 0 ? formatCurrency(Math.abs(todayIncome - todayExpense)).replace("Rp", "") : "0"}`}
                    color={todayIncome > todayExpense ? "emerald" : todayExpense > todayIncome ? "rose" : "sky"}
                    mounted={mounted}
                    isStealthMode={isStealthMode}
                />

                {/* Budget Remaining */}
                <StatCard
                    icon={Target}
                    label="Sisa Budget Minggu Ini"
                    value={formatCurrency(weeklyBudgetRemaining)}
                    subValue={`${budgetPercentage}% tersisa`}
                    trend={budgetPercentage < 20 ? "down" : budgetPercentage > 50 ? "up" : "neutral"}
                    trendValue={`${budgetPercentage}%`}
                    color={budgetPercentage < 20 ? "rose" : budgetPercentage > 50 ? "emerald" : "orange"}
                    mounted={mounted}
                    isStealthMode={isStealthMode}
                />

                {/* Streak */}
                <StatCard
                    icon={Flame}
                    label="Streak Hari Ini"
                    value={`${currentStreak} Hari`}
                    subValue={currentStreak > 0 ? "Keep it up! 🔥" : "Start today! 💪"}
                    trend={currentStreak > 0 ? "up" : "neutral"}
                    trendValue={currentStreak > longestStreak * 0.8 ? "🔥 Record" : ""}
                    color={currentStreak > 0 ? "orange" : "violet"}
                    mounted={mounted}
                    isStealthMode={false}
                />

                {/* Quick Action Card */}
                <motion.button
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden rounded-2xl p-4 border border-sky-200 dark:border-sky-800 min-w-[160px] flex-shrink-0 bg-gradient-to-br from-sky-500 to-indigo-500 text-white"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
                    
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-white/80 mb-1">
                            Tips Hari Ini
                        </p>
                        <p className="text-sm font-bold leading-tight">
                            {todayExpense > todayIncome * 0.8 
                                ? "Hati-hati pengeluaran hari ini!" 
                                : "Bagus! Pertahankan hematnya 💪"}
                        </p>
                    </div>
                </motion.button>
            </div>
        </section>
    );
}
