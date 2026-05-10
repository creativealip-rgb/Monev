"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { normalizeDateValue } from "@/frontend/lib/normalize-date";
import { TransactionWithCategory } from "@/types";
import { cn } from "@/frontend/lib/utils";
import { GroupedTransactions } from "../types";

interface TransactionListProps {
    groupedTransactions: GroupedTransactions;
    showBulkActions: boolean;
    selectedIds: Set<number>;
    onToggleSelect: (id: number) => void;
    onTransactionClick: (transaction: TransactionWithCategory) => void;
    onTransactionEdit: (transaction: TransactionWithCategory) => void;
    onTransactionDelete: (id: number) => void;
    showDuplicatesOnly: boolean;
    activeDuplicateIds: Set<number>;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    loadMoreRef: (node?: Element | null) => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

const INITIAL_GROUP_COUNT = 8;
const GROUP_INCREMENT = 8;

function formatGroupLabel(dateKey: string, transactions: TransactionWithCategory[]): string {
    const fallback = "Tanggal tidak valid";
    const sampleDate = transactions[0]?.date;
    const normalizedDate = sampleDate ? normalizeDateValue(sampleDate) : normalizeDateValue(dateKey);

    if (isNaN(normalizedDate.getTime())) {
        return fallback;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(normalizedDate);
}

export function TransactionList({
    groupedTransactions,
    showBulkActions,
    selectedIds,
    onToggleSelect,
    onTransactionClick,
    onTransactionEdit,
    onTransactionDelete,
    showDuplicatesOnly,
    activeDuplicateIds,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
}: TransactionListProps) {
    const groupedEntries = useMemo(
        () => Object.entries(groupedTransactions) as [string, TransactionWithCategory[]][],
        [groupedTransactions]
    );
    const [visibleGroupCount, setVisibleGroupCount] = useState(INITIAL_GROUP_COUNT);
    const visibleGroups = groupedEntries.slice(0, visibleGroupCount);
    const hasHiddenClientGroups = visibleGroupCount < groupedEntries.length;

    const revealMoreGroups = () => {
        setVisibleGroupCount((count) => Math.min(count + GROUP_INCREMENT, groupedEntries.length));
    };

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                {visibleGroups.map(
                    ([date, dayTransactions]) => (
                        <div key={date}>
                            <h3 className="text-xs font-bold text-muted-foreground mb-3 py-1 px-2 uppercase tracking-widest">
                                {formatGroupLabel(date, dayTransactions)}
                            </h3>
                            <div className="space-y-3">
                                {dayTransactions.map((t) => (
                                    <motion.div
                                        key={t.id}
                                        variants={itemVariants}
                                        layout
                                        className={cn(
                                            "group transition-all duration-200",
                                            showDuplicatesOnly && activeDuplicateIds.has(t.id)
                                                ? "ring-2 ring-amber-400/60 rounded-2xl"
                                                : ""
                                        )}
                                    >
                                        <TransactionItem
                                            transaction={t}
                                            showCheckbox={showBulkActions}
                                            isSelected={selectedIds.has(t.id)}
                                            onSelect={onToggleSelect}
                                            onEdit={onTransactionEdit}
                                            onDelete={onTransactionDelete}
                                            onClick={() => {
                                                if (!showBulkActions) {
                                                    onTransactionClick(t);
                                                }
                                            }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </motion.div>

            {hasHiddenClientGroups && (
                <button
                    type="button"
                    onClick={revealMoreGroups}
                    className="mt-6 w-full rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
                >
                    Tampilkan transaksi lainnya
                </button>
            )}

            {/* Sentinel for infinite scroll - only show when not in duplicates mode */}
            {!showDuplicatesOnly && !hasHiddenClientGroups && (
                <div ref={loadMoreRef} className="h-20 min-h-[80px] flex items-center justify-center">
                    {isFetchingNextPage && (
                        <Loader2 className="animate-spin text-muted-foreground" size={24} />
                    )}
                </div>
            )}

            {!hasNextPage && Object.keys(groupedTransactions).length > 0 && !showDuplicatesOnly && (
                <p className="text-center text-xs text-muted-foreground py-4">
                    Semua transaksi sudah ditampilkan
                </p>
            )}
        </>
    );
}
