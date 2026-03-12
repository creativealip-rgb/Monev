"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/frontend/lib/utils";

export interface BalanceDetailModalProps {
    show: boolean;
    mounted: boolean;
    stats: {
        balance: number;
        totalAccounts?: number;
        totalGoals?: number;
        totalInvestments?: number;
    };
    onClose: () => void;
}

export function BalanceDetailModal({
    show,
    mounted,
    stats,
    onClose,
}: BalanceDetailModalProps) {
    if (!show || !mounted) return null;

    const total = (stats.totalAccounts || 0) + (stats.totalGoals || 0) + (stats.totalInvestments || 0);

    const progressBar = (() => {
        if (total <= 0) {
            return <div className="w-full bg-slate-200/50 dark:bg-slate-700 h-full" />;
        }
        // Show breakdown based on what we have
        const accountPct = total > 0 ? ((stats.totalAccounts || 0) / total) * 100 : 0;
        const goalsPct = total > 0 ? ((stats.totalGoals || 0) / total) * 100 : 0;
        const investmentsPct = total > 0 ? ((stats.totalInvestments || 0) / total) * 100 : 0;
        return (
            <>
                <div className="h-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.4)]" style={{ width: `${accountPct}%` }} />
                <div className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{ width: `${goalsPct}%` }} />
                <div className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]" style={{ width: `${investmentsPct}%` }} />
            </>
        );
    })();

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"
                onClick={onClose}
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
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="text-center mb-6 relative z-10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Total Kekayaan Bersih</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tight tabular-nums">
                        {!mounted ? "..." : formatCurrency(total)}
                    </h3>
                </div>

                <div className="mb-8 relative z-10 px-1">
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden ring-4 ring-sky-50 dark:ring-slate-800">
                        {progressBar}
                    </div>
                </div>

                <div className="space-y-7 relative z-10 px-2">
                    <div className="flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] border-2 border-white dark:border-slate-900" />
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saldo Aktif</p>
                                <p className="text-[10px] text-muted-foreground font-medium">Dompet & rekening bank (liquid)</p>
                            </div>
                        </div>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                            {!mounted ? "..." : formatCurrency(stats.totalAccounts || 0)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white dark:border-slate-900" />
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tabungan Goals</p>
                                <p className="text-[10px] text-muted-foreground font-medium">Rencana masa depan</p>
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
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Investasi</p>
                                <p className="text-[10px] text-muted-foreground font-medium">Aset bertumbuh</p>
                            </div>
                        </div>
                        <p className="text-base font-bold text-foreground tabular-nums">
                            {!mounted ? "..." : formatCurrency(stats.totalInvestments || 0)}
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 relative z-10">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                        💡 Total kekayaan = Saldo aktif + Tabungan goals + Investasi
                    </p>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
