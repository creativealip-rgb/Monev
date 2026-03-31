"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
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
    return useMemo(() => {
        const groups: GroupedTransactions = {};

        for (const transaction of transactions) {
            try {
                // Use transaction.date (actual transaction date) instead of createdAt
                const dateObj = new Date(transaction.date);
                const date = isNaN(dateObj.getTime())
                    ? "Tanggal tidak valid"
                    : format(dateObj, "dd MMM yyyy", {
                        locale: locale === "id" ? idLocale : enUS,
                    });

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
    }, [transactions, locale]);
}
