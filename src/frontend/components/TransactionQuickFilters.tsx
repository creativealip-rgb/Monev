"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { useState, useEffect } from "react";

type FilterPeriod = "today" | "week" | "month" | "all";

interface TransactionQuickFiltersProps {
    activeFilter: FilterPeriod;
    onFilterChange: (filter: FilterPeriod) => void;
}

const filters: { id: FilterPeriod; label: string; days: number }[] = [
    { id: "today", label: "Hari Ini", days: 1 },
    { id: "week", label: "Minggu Ini", days: 7 },
    { id: "month", label: "Bulan Ini", days: 30 },
    { id: "all", label: "Semua", days: 365 },
];

export function TransactionQuickFilters({ activeFilter, onFilterChange }: TransactionQuickFiltersProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Use requestAnimationFrame to avoid synchronous setState
        requestAnimationFrame(() => {
            setMounted(true);
        });
        
        // Load saved preference from localStorage
        const saved = localStorage.getItem("monev_dashboard_filter") as FilterPeriod;
        if (saved && filters.some(f => f.id === saved)) {
            onFilterChange(saved);
        }
    }, [onFilterChange]);

    const handleFilterChange = (filterId: FilterPeriod) => {
        onFilterChange(filterId);
        localStorage.setItem("monev_dashboard_filter", filterId);
    };

    if (!mounted) {
        return (
            <div className="flex gap-2">
                {filters.map((filter) => (
                    <div
                        key={filter.id}
                        className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 h-9 w-20"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
                <motion.button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "relative px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                        "border",
                        activeFilter === filter.id
                            ? "bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700"
                    )}
                >
                    {activeFilter === filter.id && (
                        <motion.div
                            layoutId="activeFilter"
                            className="absolute inset-0 bg-sky-500 rounded-full -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {filter.label}
                </motion.button>
            ))}
        </div>
    );
}

// Helper function to filter transactions by period
export function filterTransactionsByPeriod<T extends { createdAt: string | Date }>(
    transactions: T[],
    period: FilterPeriod
): T[] {
    const now = new Date();
    const filterDays = filters.find(f => f.id === period)?.days || 30;
    
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - filterDays);

    return transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= cutoffDate;
    });
}
