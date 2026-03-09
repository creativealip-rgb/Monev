"use client";

import { useMemo } from "react";
import { TransactionWithCategory } from "@/types";

interface UseTransactionFiltersOptions {
    transactions: TransactionWithCategory[];
    searchQuery: string;
    filterCategory: number | "all";
    filterType: "all" | "expense" | "income";
    dateRange: { start: string; end: string } | null;
    amountRange: { min: number; max: number } | null;
    sortBy: "date" | "amount" | "category";
    sortOrder: "asc" | "desc";
    showDuplicatesOnly: boolean;
}

export function useTransactionFilters({
    transactions,
    searchQuery,
    filterCategory,
    filterType,
    dateRange,
    amountRange,
    sortBy,
    sortOrder,
    showDuplicatesOnly
}: UseTransactionFiltersOptions) {
    // Filter transactions
    const filteredTransactions = useMemo(() => {
        const result = transactions.filter(t => {
            const matchesCategory = filterCategory === "all" || Number(t.categoryId) === filterCategory;
            const matchesType = filterType === "all" || t.type === filterType;

            // Date range filter
            let matchesDate = true;
            if (dateRange) {
                const transDate = new Date(t.createdAt);
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = transDate >= startDate && transDate <= endDate;
            }

            // Amount range filter
            let matchesAmount = true;
            if (amountRange) {
                matchesAmount = t.amount >= amountRange.min && t.amount <= amountRange.max;
            }

            return matchesCategory && matchesType && matchesDate && matchesAmount;
        });

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "date") {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
            } else if (sortBy === "amount") {
                return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
            } else if (sortBy === "category") {
                const catA = a.categoryName || "";
                const catB = b.categoryName || "";
                return sortOrder === "desc" ? catB.localeCompare(catA) : catA.localeCompare(catB);
            }
            return 0;
        });

        return result;
    }, [transactions, filterCategory, filterType, dateRange, amountRange, sortBy, sortOrder]);

    // Duplicate detection: same amount + same category + same day
    const duplicateIds = useMemo(() => {
        const ids = new Set<number>();
        const seen = new Map<string, number[]>();

        for (const t of transactions) {
            const dateKey = new Date(t.createdAt)
                .toISOString().slice(0, 10);
            const key = `${t.amount}-${t.categoryId}-${dateKey}`;
            const group = seen.get(key);
            if (group) {
                group.push(t.id);
            } else {
                seen.set(key, [t.id]);
            }
        }

        for (const group of seen.values()) {
            if (group.length > 1) {
                group.forEach(id => ids.add(id));
            }
        }

        return ids;
    }, [transactions]);

    const duplicateCount = duplicateIds.size;

    // Apply duplicate filter
    const displayTransactions = useMemo(() => {
        if (!showDuplicatesOnly) return filteredTransactions;
        return filteredTransactions.filter(t => duplicateIds.has(t.id));
    }, [filteredTransactions, showDuplicatesOnly, duplicateIds]);

    return {
        filteredTransactions,
        displayTransactions,
        duplicateIds,
        duplicateCount
    };
}
