"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { formatCurrency } from "@/frontend/lib/utils";
import { TransactionListSkeleton, NoTransactionsEmpty } from "@/frontend/components/UI";
import { TransactionQuickFilters, filterTransactionsByPeriod } from "@/frontend/components/TransactionQuickFilters";
import { useI18n } from "@/lib/i18n";
import { useState, useMemo } from "react";
import type { RecentTransactionsWidgetProps, FilterPeriod } from "../../types";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export function RecentTransactionsWidget({
    transactions,
    loading,
    onAddNew,
}: RecentTransactionsWidgetProps) {
    const { t } = useI18n();
    const [filter, setFilter] = useState<FilterPeriod>("month");

    const filteredTransactions = useMemo(() => {
        return filterTransactionsByPeriod(transactions, filter);
    }, [transactions, filter]);

    const periodSummary = useMemo(() => {
        return filteredTransactions.reduce(
            (summary, transaction) => {
                const amount = Number(transaction.amount) || 0;
                if (transaction.type === "income") {
                    return { ...summary, income: summary.income + amount };
                }
                if (transaction.type === "expense") {
                    return { ...summary, expense: summary.expense + amount };
                }
                return summary;
            },
            { income: 0, expense: 0 }
        );
    }, [filteredTransactions]);

    const cashflow = periodSummary.income - periodSummary.expense;

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="px-6"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">{t("dashboard.recentTransactions")}</h2>
                <Link href="/transactions" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1">
                    {t("dashboard.viewAll")}
                    <ChevronRight size={14} />
                </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-4 space-y-3">
                <TransactionQuickFilters
                    activeFilter={filter}
                    onFilterChange={setFilter}
                />
                {filteredTransactions.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                                <ArrowDownLeft size={12} /> Masuk
                            </div>
                            <p className="truncate text-xs font-black text-slate-900 dark:text-white">{formatCurrency(periodSummary.income)}</p>
                        </div>
                        <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-900/20">
                            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                                <ArrowUpRight size={12} /> Keluar
                            </div>
                            <p className="truncate text-xs font-black text-slate-900 dark:text-white">{formatCurrency(periodSummary.expense)}</p>
                        </div>
                        <div className="rounded-2xl bg-sky-50 p-3 dark:bg-sky-900/20">
                            <div className="mb-1 text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400">Net</div>
                            <p className="truncate text-xs font-black text-slate-900 dark:text-white">{formatCurrency(cashflow)}</p>
                        </div>
                    </div>
                )}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
                {loading ? (
                    <TransactionListSkeleton count={3} />
                ) : filteredTransactions.length === 0 ? (
                    <NoTransactionsEmpty onAddNew={onAddNew} />
                ) : (
                    <>
                        {filteredTransactions.slice(0, 5).map((t) => (
                            <TransactionItem key={t.id} transaction={t as any} />
                        ))}
                        {filteredTransactions.length <= 5 && (
                            <div className="rounded-3xl border border-slate-100 bg-white/70 px-4 py-3 text-center text-[11px] font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                                Semua transaksi periode ini sudah ditampilkan.
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.section>
    );
}
