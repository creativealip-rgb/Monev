"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, TrendingDown, Target, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    monthlyContribution?: number;
}

interface InflationAnalysis {
    goal: Goal;
    yearsRemaining: number;
    inflationAdjustedTarget: number;
    gap: number;
    requiredMonthlyIncrease: number;
    increasePercentage: number;
}

const INFLATION_RATE = 0.05; // 5% annual inflation

export default function InflationSavingPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const response = await apiFetch("/api/goals");
            const res = await response.json();
            if (res.success) setGoals(res.data || []);
        } catch (e) {
            console.error(e);
            setError("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    function calculateInflationAnalysis(goal: Goal): InflationAnalysis {
        const now = new Date();
        const deadline = goal.deadline ? new Date(goal.deadline) : new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
        const yearsRemaining = Math.max(0.5, (deadline.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        const inflationAdjustedTarget = goal.targetAmount * Math.pow(1 + INFLATION_RATE, yearsRemaining);
        const gap = inflationAdjustedTarget - goal.targetAmount;

        const remainingToSave = inflationAdjustedTarget - goal.currentAmount;
        const monthsRemaining = Math.max(1, yearsRemaining * 12);
        const requiredMonthly = remainingToSave / monthsRemaining;
        const currentMonthly = goal.monthlyContribution || (goal.targetAmount - goal.currentAmount) / monthsRemaining;
        const requiredMonthlyIncrease = Math.max(0, requiredMonthly - currentMonthly);
        const increasePercentage = currentMonthly > 0 ? (requiredMonthlyIncrease / currentMonthly) * 100 : 0;

        return {
            goal,
            yearsRemaining,
            inflationAdjustedTarget,
            gap,
            requiredMonthlyIncrease,
            increasePercentage,
        };
    }

    const analyses = goals.map(calculateInflationAnalysis);
    const totalGap = analyses.reduce((sum, a) => sum + a.gap, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-24 pt-safe">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                    <div className="flex items-center gap-3">
                        <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Inflation-Adjusted Saving</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">DAMPAK INFLASI</p>
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
                            <h1 className="text-lg font-bold text-foreground">Inflation-Adjusted Saving</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">DAMPAK INFLASI</p>
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
                        <h1 className="text-lg font-bold text-foreground">Inflation-Adjusted Saving</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">DAMPAK INFLASI</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-4">
                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="card-clean rounded-2xl p-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 border border-red-200/50 dark:border-red-700/30"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <TrendingDown size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Gap Inflasi</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGap)}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Dengan inflasi 5% per tahun, target tabungan kamu perlu ditambah sebesar ini agar nilainya tetap sama.
                    </p>
                </motion.div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="card-clean rounded-2xl p-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-700/30"
                >
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        Inflasi membuat uang kamu kehilangan daya beli setiap tahun. Rp 10 juta hari ini nilainya hanya Rp 9,5 juta tahun depan.
                    </p>
                </motion.div>

                {/* Goal Analysis Cards */}
                {analyses.length > 0 ? (
                    <div className="space-y-4">
                        {analyses.map((analysis, index) => {
                            const progress = (analysis.goal.currentAmount / analysis.inflationAdjustedTarget) * 100;
                            const originalProgress = (analysis.goal.currentAmount / analysis.goal.targetAmount) * 100;

                            return (
                                <motion.div
                                    key={analysis.goal.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                                    className="card-clean rounded-2xl p-5"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target size={16} className="text-primary" />
                                        <h3 className="text-sm font-semibold text-foreground">{analysis.goal.name}</h3>
                                    </div>

                                    {/* Original vs Adjusted */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-muted/50 dark:bg-muted/30">
                                            <p className="text-xs text-muted-foreground">Target Awal</p>
                                            <p className="text-sm font-bold text-foreground">{formatCurrency(analysis.goal.targetAmount)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30">
                                            <p className="text-xs text-muted-foreground">Setelah Inflasi</p>
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(analysis.inflationAdjustedTarget)}</p>
                                        </div>
                                    </div>

                                    {/* Gap */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs text-muted-foreground">Gap inflasi</span>
                                        <span className="text-xs font-semibold text-red-500">+{formatCurrency(analysis.gap)}</span>
                                    </div>

                                    {/* Progress Bar - Original */}
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">Progress (target awal)</span>
                                            <span className="text-xs font-medium text-foreground">{Math.min(100, originalProgress).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-500"
                                                style={{ width: `${Math.min(100, originalProgress)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Progress Bar - Inflation Adjusted */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">Progress (setelah inflasi)</span>
                                            <span className="text-xs font-medium text-red-500">{Math.min(100, progress).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    progress < 30 ? "bg-red-500" : progress < 60 ? "bg-amber-500" : "bg-green-500"
                                                )}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Recommendation */}
                                    {analysis.increasePercentage > 0 && (
                                        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-700/30">
                                            <ArrowUpRight size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                                Naikkan tabungan bulanan sebesar{" "}
                                                <span className="font-bold">{analysis.increasePercentage.toFixed(0)}%</span>{" "}
                                                (+{formatCurrency(analysis.requiredMonthlyIncrease)}/bulan) untuk mengalahkan inflasi.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="card-clean rounded-2xl p-6 text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                            <Target size={24} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Belum ada tujuan keuangan</p>
                        <p className="text-xs text-muted-foreground mt-1">Buat tujuan keuangan dulu untuk melihat dampak inflasi.</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
