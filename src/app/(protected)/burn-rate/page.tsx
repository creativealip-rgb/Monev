"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Calendar, TrendingDown, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface AnalyticsData {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    previousPeriod?: {
        totalIncome: number;
        totalExpense: number;
    };
    dailyExpenses?: number[];
}

export default function BurnRatePage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const response = await apiFetch("/api/analytics?period=monthly");
            const res = await response.json();
            if (res.success) setAnalytics(res.data);
        } catch (e) {
            console.error(e);
            setError("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const totalExpense = analytics?.totalExpense || 0;
    const totalIncome = analytics?.totalIncome || 0;
    const currentBalance = analytics?.balance || 0;

    const dailyBurnRate = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;
    const daysUntilBroke = dailyBurnRate > 0 ? Math.floor(currentBalance / dailyBurnRate) : 999;
    const budgetConsumed = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
    const projectedMonthlyExpense = dailyBurnRate * daysInMonth;

    const previousExpense = analytics?.previousPeriod?.totalExpense || 0;
    const previousIncome = analytics?.previousPeriod?.totalIncome || 0;
    const previousBurnRate = previousIncome > 0 ? (previousExpense / previousIncome) * 100 : 0;
    const burnRateChange = budgetConsumed - previousBurnRate;

    function getStatusColor(percentage: number): string {
        if (percentage < 60) return "text-green-500";
        if (percentage < 80) return "text-amber-500";
        return "text-red-500";
    }

    function getStatusBgColor(percentage: number): string {
        if (percentage < 60) return "bg-green-500";
        if (percentage < 80) return "bg-amber-500";
        return "bg-red-500";
    }

    function getStatusLabel(percentage: number): string {
        if (percentage < 60) return "Aman";
        if (percentage < 80) return "Waspada";
        return "Bahaya";
    }

    function getStatusIcon(percentage: number) {
        if (percentage < 60) return <CheckCircle size={18} className="text-green-500" />;
        if (percentage < 80) return <AlertCircle size={18} className="text-amber-500" />;
        return <Flame size={18} className="text-red-500" />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-24 pt-safe">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                    <div className="flex items-center gap-3">
                        <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Burn Rate Check</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">KECEPATAN BELANJA</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card-clean rounded-2xl p-4 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background pb-24 pt-safe">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                    <div className="flex items-center gap-3">
                        <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Burn Rate Check</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">KECEPATAN BELANJA</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-6">
                    <div className="card-clean rounded-2xl p-6 text-center">
                        <p className="text-red-500">{error}</p>
                        <button onClick={loadData} className="mt-3 text-sm text-primary font-medium">
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 pt-safe">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                <div className="flex items-center gap-3">
                    <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Burn Rate Check</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">KECEPATAN BELANJA</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-4">
                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                        "card-clean rounded-2xl p-5 border",
                        budgetConsumed < 60
                            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-green-200/50 dark:border-green-700/30"
                            : budgetConsumed < 80
                            ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20 border-amber-200/50 dark:border-amber-700/30"
                            : "bg-gradient-to-br from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20 border-red-200/50 dark:border-red-700/30"
                    )}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                budgetConsumed < 60 ? "bg-green-500/20" : budgetConsumed < 80 ? "bg-amber-500/20" : "bg-red-500/20"
                            )}>
                                {getStatusIcon(budgetConsumed)}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status Burn Rate</p>
                                <p className={cn("text-lg font-bold", getStatusColor(budgetConsumed))}>
                                    {getStatusLabel(budgetConsumed)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={cn("text-2xl font-bold", getStatusColor(budgetConsumed))}>
                                {budgetConsumed.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">terpakai</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 rounded-full bg-muted/50 dark:bg-muted/30 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, budgetConsumed)}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={cn("h-full rounded-full", getStatusBgColor(budgetConsumed))}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">0%</span>
                        <span className="text-xs text-muted-foreground">60%</span>
                        <span className="text-xs text-muted-foreground">80%</span>
                        <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                </motion.div>

                {/* Sisa Gaji Countdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="card-clean rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Sisa Gaji Countdown</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/30 text-center">
                            <p className={cn(
                                "text-3xl font-bold",
                                daysUntilBroke <= 7 ? "text-red-500" : daysUntilBroke <= 14 ? "text-amber-500" : "text-green-500"
                            )}>
                                {daysUntilBroke > 365 ? "∞" : daysUntilBroke}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Hari sampai habis</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/30 text-center">
                            <p className="text-3xl font-bold text-foreground">{daysRemaining}</p>
                            <p className="text-xs text-muted-foreground mt-1">Hari sisa bulan ini</p>
                        </div>
                    </div>
                    {daysUntilBroke < daysRemaining && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-700/30">
                            <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Peringatan: Dengan kecepatan belanja saat ini, saldo kamu akan habis sebelum akhir bulan!
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Daily Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="card-clean rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Flame size={18} className="text-orange-500" />
                        <h2 className="text-sm font-semibold text-foreground">Detail Burn Rate</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Pengeluaran harian rata-rata</span>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(dailyBurnRate)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Total pengeluaran bulan ini</span>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(totalExpense)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Pemasukan bulan ini</span>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(totalIncome)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border/30">
                            <span className="text-sm text-muted-foreground">Proyeksi pengeluaran sebulan</span>
                            <span className={cn(
                                "text-sm font-semibold",
                                projectedMonthlyExpense > totalIncome ? "text-red-500" : "text-foreground"
                            )}>
                                {formatCurrency(projectedMonthlyExpense)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Saldo saat ini</span>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(currentBalance)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Comparison with Last Month */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="card-clean rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Perbandingan Bulan Lalu</h2>
                    </div>
                    {previousExpense > 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-muted/50 dark:bg-muted/30">
                                    <p className="text-xs text-muted-foreground">Burn Rate Bulan Ini</p>
                                    <p className={cn("text-lg font-bold", getStatusColor(budgetConsumed))}>
                                        {budgetConsumed.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/50 dark:bg-muted/30">
                                    <p className="text-xs text-muted-foreground">Burn Rate Bulan Lalu</p>
                                    <p className={cn("text-lg font-bold", getStatusColor(previousBurnRate))}>
                                        {previousBurnRate.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <div className={cn(
                                "p-3 rounded-xl flex items-center gap-2",
                                burnRateChange > 0
                                    ? "bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-700/30"
                                    : "bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-700/30"
                            )}>
                                <TrendingDown size={16} className={burnRateChange > 0 ? "text-red-500 rotate-180" : "text-green-500"} />
                                <p className={cn(
                                    "text-xs font-medium",
                                    burnRateChange > 0 ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"
                                )}>
                                    {burnRateChange > 0
                                        ? `Burn rate naik ${burnRateChange.toFixed(1)}% dari bulan lalu. Kurangi pengeluaran!`
                                        : `Burn rate turun ${Math.abs(burnRateChange).toFixed(1)}% dari bulan lalu. Bagus! 🎉`
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">Data bulan lalu belum tersedia.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
