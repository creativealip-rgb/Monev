"use client";

import { useMemo } from "react";
import { normalizeDateValue } from "@/frontend/lib/normalize-date";
import { TransactionWithCategory } from "@/types";
import { GroupedTransactions } from "../types";

interface UseGroupedTransactionsProps {
    transactions: TransactionWithCategory[];
    locale: string;
}

// Kunci grouping dihitung di timezone yang SAMA dengan label tampilan
// (Asia/Jakarta di TransactionList.formatGroupLabel). Kalau pakai UTC
// (toISOString), transaksi dekat tengah malam bisa ke-split jadi 2 grup
// padahal labelnya sama → header tanggal duplikat.
function getJakartaDateKey(dateObj: Date): string {
    // en-CA menghasilkan format YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(dateObj);
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
                    : getJakartaDateKey(dateObj);

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
