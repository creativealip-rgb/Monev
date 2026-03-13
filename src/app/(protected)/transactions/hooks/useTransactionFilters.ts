"use client";

import { useState, useMemo, useCallback } from "react";
import { TransactionWithCategory } from "@/types";
import {
    FilterType,
    SortBy,
    SortOrder,
    DateRange,
    AmountRange,
    UseTransactionFiltersReturn,
} from "../types";

interface UseTransactionFiltersProps {
    transactions: TransactionWithCategory[];
}

export function useTransactionFilters({
    transactions,
}: UseTransactionFiltersProps): UseTransactionFiltersReturn {
    const [filterCategory, setFilterCategory] = useState<number | "all">("all");
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [dateRange, setDateRange] = useState<DateRange | null>(null);
    const [amountRange, setAmountRange] = useState<AmountRange | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>("date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const filteredTransactions = useMemo(() => {
        const result = transactions.filter((t) => {
            const matchesCategory =
                filterCategory === "all" || Number(t.categoryId) === filterCategory;
            const matchesType = filterType === "all" || t.type === filterType;

            let matchesDate = true;
            if (dateRange) {
                const transDate = new Date(t.createdAt);
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = transDate >= startDate && transDate <= endDate;
            }

            let matchesAmount = true;
            if (amountRange) {
                matchesAmount =
                    t.amount >= amountRange.min && t.amount <= amountRange.max;
            }

            return matchesCategory && matchesType && matchesDate && matchesAmount;
        });

        result.sort((a, b) => {
            if (sortBy === "date") {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
            } else if (sortBy === "amount") {
                return sortOrder === "desc"
                    ? b.amount - a.amount
                    : a.amount - b.amount;
            } else if (sortBy === "category") {
                const catA = a.categoryName || "";
                const catB = b.categoryName || "";
                return sortOrder === "desc"
                    ? catB.localeCompare(catA)
                    : catA.localeCompare(catB);
            }
            return 0;
        });

        return result;
    }, [transactions, filterCategory, filterType, dateRange, amountRange, sortBy, sortOrder]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filterCategory !== "all") count++;
        if (filterType !== "all") count++;
        if (dateRange) count++;
        if (amountRange) count++;
        return count;
    }, [filterCategory, filterType, dateRange, amountRange]);

    const resetFilters = useCallback(() => {
        setFilterCategory("all");
        setFilterType("all");
        setDateRange(null);
        setAmountRange(null);
    }, []);

    return {
        filterCategory,
        setFilterCategory,
        filterType,
        setFilterType,
        dateRange,
        setDateRange,
        amountRange,
        setAmountRange,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        filteredTransactions,
        activeFiltersCount,
        resetFilters,
    };
}
