"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { TransactionItem } from "@/frontend/components/TransactionItem";
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

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="px-6"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">{t("dashboard.recentTransactions")}</h2>
                <Link href="/transactions" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
                    {t("dashboard.viewAll")}
                </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-4">
                <TransactionQuickFilters
                    activeFilter={filter}
                    onFilterChange={setFilter}
                />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
                {loading ? (
                    <TransactionListSkeleton count={3} />
                ) : filteredTransactions.length === 0 ? (
                    <NoTransactionsEmpty onAddNew={onAddNew} />
                ) : (
                    filteredTransactions.slice(0, 5).map((t) => (
                        <TransactionItem key={t.id} transaction={t as any} />
                    ))
                )}
            </motion.div>
        </motion.section>
    );
}
