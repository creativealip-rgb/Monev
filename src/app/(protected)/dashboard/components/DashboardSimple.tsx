"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CalendarCheck, Plus, ReceiptText, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

import { TransactionItem } from "@/frontend/components/TransactionItem";
import { TransactionListSkeleton, NoTransactionsEmpty } from "@/frontend/components/UI";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { trackProductEvent } from "@/frontend/lib/product-analytics";

import type { TransactionWithCategory } from "@/types";
import type { TransactionType } from "@/frontend/components/TransactionForm/types";
import type { DashboardStats, Transaction, TodayStats } from "../types";

interface DashboardSimpleProps {
    stats: DashboardStats;
    todayStats: TodayStats;
    transactions: Transaction[];
    loading: boolean;
    mounted: boolean;
    isStealthMode: boolean;
    onAddNew: (type: TransactionType) => void;
}

const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
};

function getSafetyState(stats: DashboardStats) {
    const monthlyLeft = stats.income - stats.expense;
    const budgetTotal = stats.weeklyBudgetTotal || 0;
    const budgetLeft = stats.weeklyBudgetRemaining || 0;
    const budgetRatio = budgetTotal > 0 ? budgetLeft / budgetTotal : null;

    if (monthlyLeft < 0 || budgetRatio !== null && budgetRatio < 0.15) {
        return {
            label: "Bahaya",
            copy: "Pengeluaran sudah terlalu dekat batas. Tahan dulu yang tidak penting.",
            icon: ShieldAlert,
            className: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/60",
        };
    }

    if (budgetRatio !== null && budgetRatio < 0.35 || monthlyLeft < stats.income * 0.2) {
        return {
            label: "Waspada",
            copy: "Masih aman, tapi ritme belanja bulan ini mulai perlu dijaga.",
            icon: ShieldQuestion,
            className: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60",
        };
    }

    return {
        label: "Aman",
        copy: "Cashflow bulan ini masih sehat. Lanjutkan kebiasaan catat harian.",
        icon: ShieldCheck,
        className: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60",
    };
}

export function DashboardSimple({
    stats,
    todayStats,
    transactions,
    loading,
    mounted,
    isStealthMode,
    onAddNew,
}: DashboardSimpleProps) {
    const monthlyLeft = stats.income - stats.expense;
    const safety = getSafetyState(stats);
    const SafetyIcon = safety.icon;
    const budgetTotal = stats.weeklyBudgetTotal || 0;
    const budgetLeft = stats.weeklyBudgetRemaining || 0;
    const budgetUsedPercent = budgetTotal > 0
        ? Math.min(100, Math.max(0, Math.round(((budgetTotal - budgetLeft) / budgetTotal) * 100)))
        : 0;
    const hasTransactions = transactions.length > 0;
    const amount = (value: number) => isStealthMode ? "••••••" : formatCurrency(value);

    useEffect(() => {
        trackProductEvent("simple_dashboard_viewed", {
            hasTransactions,
            hasBudget: budgetTotal > 0,
            safetyStatus: safety.label,
        });
    }, [budgetTotal, hasTransactions, safety.label]);

    return (
        <motion.main
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.08 }}
            className="space-y-5 px-4 pb-4 sm:px-6"
        >
            <motion.section
                variants={itemVariants}
                className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="relative bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 p-5 text-white">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/75">Sisa bulan ini</p>
                    <h2 className="mt-2 text-4xl font-black tracking-tight">
                        {mounted ? amount(monthlyLeft) : "-"}
                    </h2>
                    <p className="mt-2 max-w-sm text-sm font-semibold text-white/85">
                        Fokus utama: catat uang masuk dan keluar. Sisanya biar Monev bantu ringkas.
                    </p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <div className={cn("rounded-3xl border p-4", safety.className)}>
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                            <SafetyIcon size={16} /> Status {safety.label}
                        </div>
                        <p className="text-sm font-semibold leading-relaxed">{safety.copy}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <CalendarCheck size={16} /> Hari ini
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {todayStats.count} transaksi dicatat hari ini.
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Keluar {amount(todayStats.expense)} · Masuk {amount(todayStats.income)}
                        </p>
                    </div>
                </div>
            </motion.section>

            <motion.section variants={itemVariants} className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => onAddNew("expense")}
                    className="group rounded-3xl border border-rose-100 bg-rose-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-rose-900/60 dark:bg-rose-950/30"
                >
                    <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 transition group-hover:scale-105">
                        <ArrowUpRight size={22} />
                    </span>
                    <span className="block text-base font-black text-rose-700 dark:text-rose-200">+ Pengeluaran</span>
                    <span className="mt-1 block text-xs font-semibold text-rose-600/75 dark:text-rose-300/75">Makan, transport, belanja</span>
                </button>
                <button
                    type="button"
                    onClick={() => onAddNew("income")}
                    className="group rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900/60 dark:bg-emerald-950/30"
                >
                    <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition group-hover:scale-105">
                        <ArrowDownLeft size={22} />
                    </span>
                    <span className="block text-base font-black text-emerald-700 dark:text-emerald-200">+ Pemasukan</span>
                    <span className="mt-1 block text-xs font-semibold text-emerald-600/75 dark:text-emerald-300/75">Gaji, bonus, transfer</span>
                </button>
            </motion.section>

            <motion.section variants={itemVariants} className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ringkasan Bulan Ini</p>
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">Uang masuk vs keluar</h3>
                    </div>
                    <ReceiptText className="text-sky-500" size={22} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                        <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-300">Masuk</p>
                        <p className="mt-1 truncate text-xs font-black text-slate-950 dark:text-white">{amount(stats.income)}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/30">
                        <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-300">Keluar</p>
                        <p className="mt-1 truncate text-xs font-black text-slate-950 dark:text-white">{amount(stats.expense)}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/30">
                        <p className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-300">Sisa</p>
                        <p className="mt-1 truncate text-xs font-black text-slate-950 dark:text-white">{amount(monthlyLeft)}</p>
                    </div>
                </div>
            </motion.section>

            {budgetTotal > 0 && (
                <motion.section variants={itemVariants} className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Batas Bulanan</p>
                            <h3 className="text-lg font-black text-slate-950 dark:text-white">Budget utama</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {budgetUsedPercent}% terpakai
                        </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: `${budgetUsedPercent}%` }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Sisa batas minggu ini {amount(budgetLeft)} dari {amount(budgetTotal)}.
                    </p>
                </motion.section>
            )}

            <motion.section variants={itemVariants} className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Terakhir</p>
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">Transaksi terbaru</h3>
                    </div>
                    <Link href="/transactions" className="text-xs font-black text-sky-600 dark:text-sky-400">
                        Lihat semua
                    </Link>
                </div>
                {loading ? (
                    <TransactionListSkeleton count={3} />
                ) : !hasTransactions ? (
                    <NoTransactionsEmpty onAddNew={() => onAddNew("expense")} />
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 5).map((transaction) => (
                            <TransactionItem key={transaction.id} transaction={transaction as unknown as TransactionWithCategory} hideAmount={isStealthMode} />
                        ))}
                    </div>
                )}
            </motion.section>

            <motion.button
                variants={itemVariants}
                type="button"
                onClick={() => onAddNew("expense")}
                className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-2xl shadow-slate-950/25 transition hover:scale-105 dark:bg-white dark:text-slate-950"
                aria-label="Tambah transaksi"
            >
                <Plus size={24} />
            </motion.button>
        </motion.main>
    );
}
