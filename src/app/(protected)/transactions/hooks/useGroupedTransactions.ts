"use client";

import { useMemo } from "react";
import { normalizeDateValue } from "@/frontend/lib/normalize-date";
import { TransactionWithCategory } from "@/types";
import { GroupedTransactions } from "../types";

interface UseGroupedTransactionsProps {
    transactions: TransactionWithCategory[];
    locale: string;
}

export function useGroupedTransactions({
    transactions,
    locale,
}: UseGroupedTransactionsProps): GroupedTransactions {
    void locale;

    return useMemo(() => {
        const groups: GroupedTransactions = {};

        for (const transaction of transactions) {
            try {
                const dateObj = normalizeDateValue(transaction.date);
                const date = isNaN(dateObj.getTime())
                    ? "invalid-date"
                    : dateObj.toISOString().slice(0, 10);

                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(transaction);
            } catch {
                const fallbackDate = "Lainnya";
                if (!groups[fallbackDate]) groups[fallbackDate] = [];
                groups[fallbackDate].push(transaction);
            }
        }

        return groups;
    }, [transactions]);
}
