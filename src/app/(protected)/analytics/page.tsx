"use client";

import {
    TrendingUp,
    ArrowUpRight,
    ArrowLeft,
    Sparkles,
    Activity,
    AlertTriangle,
    CheckCircle,
    PieChart,
    Target,
    Calendar,
    AlertCircle,
    ChevronRight,
    ArrowDownRight,
    Gauge,
    PiggyBank,
    Receipt
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { ErrorEmpty } from "@/frontend/components/UI";

// Types
interface Allocation {
    name: string;
    amount: number;
    percentage: number;
    target: number;
    color: string;
}

interface MonthlyData {
    month: string;
    year: number;
    income: number;
    expense: number;
    balance: number;
}

interface TopCategory {
    name: string;
    amount: number;
    color: string;
    icon: string;
    percentage: number;
    trend: number;
}

interface GoalProgress {
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    deadline: string | null;
    icon: string;
    color: string;
}

interface BudgetAlert {
    category: string;
    spent: number;
    limit: number;
    percentage: number;
    isOver: boolean;
}

interface SpendingPattern {
    averageDailySpending: number;
    highestSpendingDay: { day: string; amount: number } | null;
    anomalies: { date: string; amount: number; description: string }[];
}

interface HealthScoreData {
    totalScore: number;
    status: string;
    message: string;
    breakdown: {
        savingsRate: number;
        expenseControl: number;
        balanceHealth: number;
        consistency: number;
    };
    recommendations: string[];
}

interface AnalysisData {
    income: number;
    expense: number;
    balance: number;
    allocations: Allocation[];
    categoryBreakdown: {
        expense: { name: string; amount: number; color: string; icon: string }[];
        income: { name: string; amount: number; color: string; icon: string }[];
    };
    insights?: string;
    health?: {
        currentBalance: number;
        avgMonthlyExpense: number;
        runway: number;
        idleCash: number;
    };
    monthlyComparison?: MonthlyData[];
    topCategories?: TopCategory[];
    goalsProgress?: GoalProgress[];
    healthScore?: HealthScoreData;
    cashflowPrediction?: { date: string; predictedBalance: number }[];
    budgetAlerts?: BudgetAlert[];
    spendingPatterns?: SpendingPattern;
    summary?: {
        avgDailySpending: number;
        savingsRate: number;
        highestSpendingDay: { day: string; amount: number } | null;
        anomaliesCount: number;
        goalsCount: number;
        completedGoals: number;
    };
}

// Helper function
function formatRp(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

// ============ COMPONENTS ============

function FinancialHealthScore({ healthData }: { healthData: HealthScoreData }) {
    const score = healthData.totalScore;
    
    const getScoreInfo = (s: number) => {
        if (s >= 80) return { label: "Sangat Sehat", color: "emerald", emoji: "💪" };
        if (s >= 60) return { label: "Sehat", color: "green", emoji: "✅" };
        if (s >= 40) return { label: "Cukup", color: "yellow", emoji: "⚠️" };
        if (s >= 20) return { label: "Perlu Perhatian", color: "orange", emoji: "😰" };
        return { label: "Kritis", color: "red", emoji: "🚨" };
    };

    const info = getScoreInfo(score);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const colorClasses: Record<string, { stroke: string; bg: string; text: string; glow: string }> = {
        emerald: { stroke: "stroke-emerald-500", bg: "bg-emerald-500", text: "text-emerald-600", glow: "shadow-emerald-500/30" },
        green: { stroke: "stroke-green-500", bg: "bg-green-500", text: "text-green-600", glow: "shadow-green-500/30" },
        yellow: { stroke: "stroke-yellow-500", bg: "bg-yellow-500", text: "text-yellow-600", glow: "shadow-yellow-500/30" },
        orange: { stroke: "stroke-orange-500", bg: "bg-orange-500", text: "text-orange-600", glow: "shadow-orange-500/30" },
        red: { stroke: "stroke-red-500", bg: "bg-red-500", text: "text-red-600", glow: "shadow-red-500/30" }
    };

    const colors = colorClasses[info.color];

    return (
        <motion.div
            variants={itemVariants}
            className="card-clean p-6 relative overflow-hidden"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Gauge size={18} className="text-white" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Skor Kesehatan Finansial</h3>
            </div>

            <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-100"
                        />
                        <motion.circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={colors.stroke}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ strokeDasharray: circumference }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900">{score}</span>
                        <span className="text-[10px] font-bold text-slate-400">dari 100</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{info.emoji}</span>
                        <span className={cn("text-lg font-bold", colors.text)}>{info.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {score >= 60
                            ? "Keuangan kamu dalam kondisi baik! Pertahankan kebiasaan ini."
                            : "Ada beberapa area yang perlu diperbaiki. Lihat insight di bawah."}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function SavingsRateMeter({ rate }: { rate: number }) {
    const getRateStatus = (r: number) => {
        if (r >= 20) return { label: "Excellent", color: "emerald", message: "Di atas standar ideal! 👏" };
        if (r >= 10) return { label: "Baik", color: "green", message: "Sudah baik, tingkatkan lagi!" };
        if (r >= 0) return { label: "Kurang", color: "yellow", message: "Coba target 20% dari income." };
        return { label: "Negatif", color: "red", message: "Pengeluaran melebihi income! 🚨" };
    };

    const status = getRateStatus(rate);
    const colorMap: Record<string, string> = {
        emerald: "bg-emerald-500",
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        red: "bg-red-500"
    };

    return (
        <motion.div variants={itemVariants} className="card-clean p-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <PiggyBank size={16} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Savings Rate</span>
                </div>
                <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    status.color === "emerald" && "bg-emerald-100 text-emerald-700",
                    status.color === "green" && "bg-green-100 text-green-700",
                    status.color === "yellow" && "bg-yellow-100 text-yellow-700",
                    status.color === "red" && "bg-red-100 text-red-700"
                )}>
                    {status.label}
                </span>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-black text-slate-900">{rate}%</span>
                <span className="text-xs text-slate-400">/ 20% ideal</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                    transition={{ duration: 1 }}
                    className={cn("h-full rounded-full", colorMap[status.color])}
                />
            </div>

            <p className="text-[10px] text-slate-500">{status.message}</p>
        </motion.div>
    );
}

function MonthlyTrendChart({ data }: { data: MonthlyData[] }) {
    if (!data || data.length === 0) return null;

    const maxAmount = Math.max(...data.flatMap(d => [d.income, d.expense]));
    const latestMonth = data[data.length - 1];
    const prevMonth = data[data.length - 2];
    const incomeChange = prevMonth
        ? ((latestMonth.income - prevMonth.income) / prevMonth.income) * 100
        : 0;
    const expenseChange = prevMonth
        ? ((latestMonth.expense - prevMonth.expense) / prevMonth.expense) * 100
        : 0;

    return (
        <motion.div variants={itemVariants} className="card-clean p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <TrendingUp size={18} className="text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Trend 6 Bulan</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Income</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-slate-500">Expense</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-32 mb-4">
                {data.map((item, i) => {
                    const incomeHeight = (item.income / maxAmount) * 100;
                    const expenseHeight = (item.expense / maxAmount) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex gap-0.5 items-end h-28">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${incomeHeight}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm min-h-[4px]"
                                />
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${expenseHeight}%` }}
                                    transition={{ delay: i * 0.1 + 0.05, duration: 0.5 }}
                                    className="flex-1 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-sm min-h-[4px]"
                                />
                            </div>
                            <span className="text-[9px] font-medium text-slate-400">{item.month}</span>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                    <div className="flex items-center gap-1 mb-1">
                        <ArrowDownRight size={12} className="text-emerald-500" />
                        <span className="text-[10px] text-slate-400">Income</span>
                        {prevMonth && (
                            <span className={cn(
                                "text-[9px] font-bold",
                                incomeChange >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatRp(latestMonth.income)}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 mb-1">
                        <ArrowUpRight size={12} className="text-rose-500" />
                        <span className="text-[10px] text-slate-400">Expense</span>
                        {prevMonth && (
                            <span className={cn(
                                "text-[9px] font-bold",
                                expenseChange <= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatRp(latestMonth.expense)}</p>
                </div>
            </div>
        </motion.div>
    );
}

function TopCategoriesChart({ data }: { data: TopCategory[] }) {
    if (!data || data.length === 0) return null;

    const maxAmount = Math.max(...data.map(d => d.amount));

    return (
        <motion.div variants={itemVariants} className="card-clean p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                        <Receipt size={18} className="text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Top Pengeluaran</h3>
                </div>
                <Link href="/transactions" className="text-[10px] font-bold text-sky-600 hover:text-sky-700">
                    Lihat Semua →
                </Link>
            </div>

            <div className="space-y-3">
                {data.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{formatRp(item.amount)}</span>
                                <span className="text-[10px] text-slate-400 w-8 text-right">{item.percentage}%</span>
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
                                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function BudgetAlertsWidget({ alerts }: { alerts: BudgetAlert[] }) {
    if (!alerts || alerts.length === 0) {
        return (
            <motion.div variants={itemVariants} className="card-clean p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle size={18} className="text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Budget Status</h3>
                </div>
                <div className="text-center py-4">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-sm font-medium text-slate-600">Semua budget aman!</p>
                    <p className="text-xs text-slate-400 mt-1">Tidak ada yang melebihi batas</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div variants={itemVariants} className="card-clean p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    alerts.some(a => a.isOver)
                        ? "bg-gradient-to-br from-red-500 to-rose-600"
                        : "bg-gradient-to-br from-orange-500 to-amber-600"
                )}>
                    <AlertTriangle size={18} className="text-white" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Budget Alerts</h3>
            </div>

            <div className="space-y-3">
                {alerts.slice(0, 3).map((alert, i) => (
                    <div
                        key={i}
                        className={cn(
                            "p-3 rounded-xl border",
                            alert.isOver
                                ? "bg-red-50 border-red-200"
                                : "bg-orange-50 border-orange-200"
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">{alert.category}</span>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                alert.isOver
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                            )}>
                                {alert.percentage}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-1">
                            <div
                                className={cn(
                                    "h-full rounded-full",
                                    alert.isOver ? "bg-red-500" : "bg-orange-500"
                                )}
                                style={{ width: `${Math.min(100, alert.percentage)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>{formatRp(alert.spent)}</span>
                            <span>Limit: {formatRp(alert.limit)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Link
                href="/budgets"
                className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
            >
                Kelola Budget <ChevronRight size={14} />
            </Link>
        </motion.div>
    );
}

function GoalsProgressWidget({ goals }: { goals: GoalProgress[] }) {
    if (!goals || goals.length === 0) {
        return (
            <motion.div variants={itemVariants} className="card-clean p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                        <Target size={18} className="text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Target Goals</h3>
                </div>
                <div className="text-center py-4">
                    <div className="text-3xl mb-2">🎯</div>
                    <p className="text-sm font-medium text-slate-600">Belum ada goals</p>
                    <Link href="/savings" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                        Buat Goals Pertama →
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div variants={itemVariants} className="card-clean p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                        <Target size={18} className="text-white" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Target Goals</h3>
                </div>
                <Link href="/savings" className="text-[10px] font-bold text-sky-600 hover:text-sky-700">
                    Lihat Semua →
                </Link>
            </div>

            <div className="space-y-4">
                {goals.slice(0, 4).map((goal, i) => (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${goal.color}20` }}
                            >
                                <Target size={16} style={{ color: goal.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700 truncate">{goal.name}</span>
                                    <span className="text-xs font-bold text-slate-900">{goal.progress}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, goal.progress)}%` }}
                                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: goal.color }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                            <span>{formatRp(goal.currentAmount)}</span>
                            <span>{formatRp(goal.targetAmount)}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function SpendingPatternsWidget({ data }: { data: SpendingPattern }) {
    if (!data) return null;

    return (
        <motion.div variants={itemVariants} className="card-clean p-6">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                    <Activity size={18} className="text-white" />
                </div>
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Pola Pengeluaran</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-[10px] text-slate-400 mb-1">Rata-rata Harian</p>
                    <p className="text-lg font-bold text-slate-900">{formatRp(data.averageDailySpending)}</p>
                </div>
                {data.highestSpendingDay && (
                    <div className="p-3 rounded-xl bg-rose-50">
                        <p className="text-[10px] text-rose-400 mb-1">Tertinggi</p>
                        <p className="text-lg font-bold text-rose-600">{formatRp(data.highestSpendingDay.amount)}</p>
                        <p className="text-[10px] text-rose-400">{data.highestSpendingDay.day}</p>
                    </div>
                )}
            </div>

            {data.anomalies && data.anomalies.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={14} className="text-amber-500" />
                        <span className="text-[11px] font-bold text-slate-500">Anomali Terdeteksi</span>
                    </div>
                    <div className="space-y-2">
                        {data.anomalies.slice(0, 2).map((anomaly, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-amber-50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{anomaly.description}</p>
                                    <p className="text-[10px] text-slate-400">{anomaly.date}</p>
                                </div>
                                <span className="text-xs font-bold text-amber-600">{formatRp(anomaly.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function AIInsights({ content }: { content: string }) {
    return (
        <motion.div
            variants={itemVariants}
            className="group relative overflow-hidden rounded-[2rem] p-[1.5px] bg-gradient-to-br from-blue-400 via-purple-400 to-rose-400 shadow-xl shadow-blue-500/10"
        >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[1.95rem] p-6 h-full">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles size={24} className="text-blue-500/30 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Sparkles size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Saran AI</h3>
                </div>

                <div className="relative">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {content || "Sedang menganalisa data kamu... ⏳"}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.15em]">Powered by Monev AI</span>
                    <Link href="/chat" className="text-[10px] font-bold text-sky-600 hover:text-sky-700 transition-colors uppercase tracking-widest">
                        Tanya Lebih Lanjut →
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

function CategoryPieChart({ data, title }: { data: { name: string; amount: number; color: string }[], title: string }) {
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    // Pre-calculate pie chart segments
    const segments = useMemo(() => {
        let cumulative = 0;
        return data.map((item) => {
            const percent = (item.amount / total) * 100;
            const startPercent = cumulative;
            cumulative += percent;

            const x1 = Math.cos(2 * Math.PI * (startPercent / 100));
            const y1 = Math.sin(2 * Math.PI * (startPercent / 100));
            const x2 = Math.cos(2 * Math.PI * (cumulative / 100));
            const y2 = Math.sin(2 * Math.PI * (cumulative / 100));

            const largeArcFlag = percent > 50 ? 1 : 0;
            const pathData = `M 50 50 L ${50 + 40 * x1} ${50 + 40 * y1} A 40 40 0 ${largeArcFlag} 1 ${50 + 40 * x2} ${50 + 40 * y2} Z`;

            return { ...item, pathData, percent };
        });
    }, [data, total]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-clean p-6 mt-4"
        >
            <h3 className="text-center text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-6">{title}</h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* SVG Donut */}
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {segments.map((segment, i) => (
                            <motion.path
                                key={i}
                                d={segment.pathData}
                                fill={segment.color}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                            />
                        ))}
                        {/* Inner Hole */}
                        <circle cx="50" cy="50" r="25" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                        <span className="text-sm font-bold text-slate-900">{formatRp(total).replace(",00", "").replace("Rp", "")}</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2 w-full">
                    {[...data].sort((a, b) => b.amount - a.amount).map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-900">{Math.round((item.amount / total) * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ============ MAIN COMPONENT ============

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewType, setViewType] = useState<"expense" | "income" | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/analytics");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            setError("Gagal memuat data analitik");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pb-28">
                <div className="sticky top-0 z-40 glass border-b border-slate-200/50">
                    <div className="flex items-center gap-3 px-6 py-4 pt-12">
                        <div className="w-10 h-10 rounded-xl bg-slate-100" />
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                    </div>
                </div>

                <div className="px-6 pt-6 space-y-6 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100">
                            <div className="h-4 w-32 bg-slate-100 rounded-full mb-4" />
                            <div className="space-y-3">
                                <div className="h-3 w-full bg-slate-100 rounded-full" />
                                <div className="h-3 w-3/4 bg-slate-100 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <ErrorEmpty
                    title="Gagal memuat data"
                    description={error || "Data analitik tidak tersedia"}
                    onRetry={fetchData}
                />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-24 bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-safe pb-4"
            >
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Analitik Keuangan</h1>
                </div>
            </motion.header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pt-6 space-y-6"
            >
                {/* Financial Health Score */}
                {data.healthScore && (
                    <FinancialHealthScore healthData={data.healthScore} />
                )}

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    {data.summary && (
                        <SavingsRateMeter rate={data.summary.savingsRate} />
                    )}
                    {data.health && (
                        <motion.div variants={itemVariants} className="card-clean p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={16} className="text-sky-500" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash Runway</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900">{data.health.runway}</span>
                                <span className="text-xs text-slate-400">bulan</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {data.health.runway >= 6 ? "✅ Aman" : data.health.runway >= 3 ? "⚠️ Cukup" : "🚨 Bahaya"}
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Monthly Trend Chart */}
                {data.monthlyComparison && (
                    <MonthlyTrendChart data={data.monthlyComparison} />
                )}

                {/* Top Categories & Budget Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.topCategories && (
                        <TopCategoriesChart data={data.topCategories} />
                    )}
                    <BudgetAlertsWidget alerts={data.budgetAlerts || []} />
                </div>

                {/* Goals Progress */}
                {data.goalsProgress && (
                    <GoalsProgressWidget goals={data.goalsProgress} />
                )}

                {/* Spending Patterns */}
                {data.spendingPatterns && (
                    <SpendingPatternsWidget data={data.spendingPatterns} />
                )}

                {/* Income vs Expense Summary */}
                <motion.div
                    variants={itemVariants}
                    className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white shadow-2xl shadow-indigo-500/20"
                >
                    <h3 className="font-semibold text-xs mb-4 text-slate-400 uppercase tracking-widest">Ringkasan Bulan Ini</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewType(viewType === "income" ? null : "income")}
                            className={cn(
                                "rounded-2xl p-4 transition-all border",
                                viewType === "income" ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total Pemasukan</p>
                            <p className="font-bold text-emerald-400 text-lg">{formatRp(data.income)}</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-medium">Klik untuk rincian</div>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewType(viewType === "expense" ? null : "expense")}
                            className={cn(
                                "rounded-2xl p-4 transition-all border",
                                viewType === "expense" ? "bg-rose-500/20 border-rose-500/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total Pengeluaran</p>
                            <p className="font-bold text-rose-400 text-lg">{formatRp(data.expense)}</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-medium">Klik untuk rincian</div>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {viewType && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <CategoryPieChart
                                    title={viewType === "income" ? "Rincian Pemasukan" : "Rincian Pengeluaran"}
                                    data={viewType === "income" ? data.categoryBreakdown.income : data.categoryBreakdown.expense}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* AI Insights */}
                {data.insights && (
                    <AIInsights content={data.insights} />
                )}

                {/* Allocation Section */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Alokasi Dana (Rule 50/30/20)</h2>
                    </div>

                    <div className="space-y-3">
                        {data.allocations.map((item, index) => {
                            const colors: Record<string, { bg: string; text: string; bar: string }> = {
                                orange: { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500" },
                                blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
                                rose: { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500" },
                            };
                            const color = colors[item.color] || colors.blue;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    className="card-clean p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color.bg, color.text)}>
                                            <PieChart size={24} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{item.name}</h3>
                                                <span className={cn("font-bold text-sm", color.text)}>
                                                    {item.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, item.percentage)}%` }}
                                                    transition={{ duration: 1, delay: index * 0.15 }}
                                                    className={cn("h-full rounded-full", color.bar)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400">
                                                    Target Ideal: {item.target}%
                                                </span>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    {formatRp(item.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}