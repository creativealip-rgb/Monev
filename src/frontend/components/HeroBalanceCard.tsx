/**
 * HeroBalanceCard Component
 * Displays the main balance card with income/expense summary
 */

"use client";

import { createPortal } from "react-dom";
import { ThemeSelector } from "@/frontend/components/ThemeSelector";
import { useHeroTheme } from "@/frontend/lib/hero-theme";
import { formatCurrency } from "@/frontend/lib/utils";
import { cn } from "@/frontend/lib/utils";
import {
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    EyeOff,
    ArrowRightLeft,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface HeroBalanceCardProps {
    stats: {
        income: number;
        expense: number;
        balance: number;
        growth?: number;
        totalGoals?: number;
        totalInvestments?: number;
        fees?: number;
    };
    mounted: boolean;
    onBalanceClick: () => void;
    onTransferClick: () => void;
    hideBalance: boolean;
    onToggleHideBalance: () => void;
}

export function HeroBalanceCard({
    stats,
    mounted,
    onBalanceClick,
    onTransferClick,
    hideBalance,
    onToggleHideBalance,
}: HeroBalanceCardProps) {
    const { themeConfig } = useHeroTheme();
    const [showDetail, setShowDetail] = useState(false);

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                aria-label="Klik untuk melihat detail saldo"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        setShowDetail(true);
                    }
                }}
                className={cn(
                    "card-clean relative overflow-hidden rounded-[32px] border border-white/10 text-white p-6 cursor-pointer",
                    "bg-gradient-to-br transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:brightness-110 hover:shadow-2xl hover:shadow-sky-500/10",
                    themeConfig.gradient,
                    themeConfig.shadowColor
                )}
            >
                <div
                    className={cn(
                        "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-60",
                        themeConfig.glowColor
                    )}
                />
                <div
                    className={cn(
                        "absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl -ml-10 -mb-10 opacity-40",
                        themeConfig.bgEffect
                    )}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 opacity-20" />

                <div
                    className="relative z-10 cursor-pointer group"
                    onClick={() => setShowDetail(true)}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <p className="text-white/70 text-xs font-medium group-hover:text-white transition-colors">
                                Total Balance
                            </p>
                            <ChevronRight
                                size={14}
                                className="text-white/50 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div onClick={(e) => e.stopPropagation()}>
                                <ThemeSelector />
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleHideBalance();
                                }}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                title={hideBalance ? "Tampilkan saldo" : "Sembunyikan saldo"}
                            >
                                {hideBalance ? (
                                    <EyeOff size={14} className="text-white/70" />
                                ) : (
                                    <Eye size={14} className="text-white/70" />
                                )}
                            </button>
                            <div
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full",
                                    (stats.growth || 0) >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        (stats.growth || 0) >= 0 ? "bg-emerald-400" : "bg-rose-400"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold",
                                        (stats.growth || 0) >= 0 ? "text-emerald-300" : "text-rose-300"
                                    )}
                                >
                                    {(stats.growth || 0) >= 0 ? "+" : ""}
                                    {(stats.growth || 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight mb-6 group-hover:scale-[1.02] transition-transform origin-left tabular-nums">
                        {!mounted
                            ? "Loading..."
                            : hideBalance
                                ? "******"
                                : formatCurrency(
                                    stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0)
                                )}
                    </h2>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <ArrowDownRight size={14} className="text-emerald-300" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                Income
                            </p>
                        </div>
                        <p className="font-bold text-[13px] text-emerald-300 tabular-nums">
                            +{" "}
                            {!mounted
                                ? "..."
                                : hideBalance
                                    ? "******"
                                    : formatCurrency(stats.income).replace("Rp", "")}
                        </p>
                    </div>

                    <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                <ArrowUpRight size={14} className="text-rose-300" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                Pengeluaran
                            </p>
                        </div>
                        <p className="font-bold text-[13px] text-rose-300 tabular-nums">
                            −{" "}
                            {!mounted
                                ? "..."
                                : hideBalance
                                    ? "******"
                                    : formatCurrency(stats.expense + (stats.fees || 0)).replace("Rp", "")}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onTransferClick}
                    className="mt-4 w-full py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowRightLeft size={16} />
                    Transfer Saldo
                </button>
            </div>

            {/* Balance Detail Modal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {showDetail && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"
                                    onClick={() => setShowDetail(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative w-[92%] max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-2xl overflow-hidden z-10 shadow-sky-200/30 dark:shadow-sky-900/20"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 to-white/10 dark:from-sky-950/40 dark:to-slate-900/10 pointer-events-none" />

                                    <div className="flex justify-end mb-2 relative z-10">
                                        <button
                                            onClick={() => setShowDetail(false)}
                                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="text-center mb-6 relative z-10">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
                                            Total Net Worth
                                        </p>
                                        <h3 className="text-3xl font-black text-foreground tracking-tight tabular-nums">
                                            {!mounted
                                                ? "..."
                                                : formatCurrency(
                                                    stats.balance +
                                                    (stats.totalGoals || 0) +
                                                    (stats.totalInvestments || 0)
                                                )}
                                        </h3>
                                    </div>

                                    <div className="mb-8 relative z-10 px-1">
                                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden ring-4 ring-sky-50 dark:ring-slate-800">
                                            {(() => {
                                                const total =
                                                    stats.balance +
                                                    (stats.totalGoals || 0) +
                                                    (stats.totalInvestments || 0);
                                                if (total <= 0)
                                                    return (
                                                        <div className="w-full bg-slate-200/50 dark:bg-slate-700 h-full" />
                                                    );
                                                const p1 = (stats.balance / total) * 100;
                                                const p2 = ((stats.totalGoals || 0) / total) * 100;
                                                const p3 = ((stats.totalInvestments || 0) / total) * 100;
                                                return (
                                                    <>
                                                        <div
                                                            className="h-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                                                            style={{ width: `${p1}%` }}
                                                        />
                                                        <div
                                                            className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                                            style={{ width: `${p2}%` }}
                                                        />
                                                        <div
                                                            className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                                                            style={{ width: `${p3}%` }}
                                                        />
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="space-y-7 relative z-10 px-2">
                                        <div className="flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] border-2 border-white dark:border-slate-900" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        Saldo Aktif
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        Liquid assets
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-foreground tabular-nums">
                                                {!mounted ? "..." : formatCurrency(stats.balance)}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white dark:border-slate-900" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        Tabungan Goals
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        Future plans
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-foreground tabular-nums">
                                                {!mounted ? "..." : formatCurrency(stats.totalGoals || 0)}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between group transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] border-2 border-white dark:border-slate-900" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        Investasi
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        Growth assets
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-base font-bold text-foreground tabular-nums">
                                                {!mounted ? "..." : formatCurrency(stats.totalInvestments || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}