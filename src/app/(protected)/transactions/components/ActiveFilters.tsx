"use client";

import { Calendar, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { DateRange, AmountRange } from "../types";

interface ActiveFiltersProps {
    dateRange: DateRange | null;
    amountRange: AmountRange | null;
    onClearDateRange: () => void;
    onClearAmountRange: () => void;
    onClearAll: () => void;
}

export function ActiveFilters({
    dateRange,
    amountRange,
    onClearDateRange,
    onClearAmountRange,
    onClearAll,
}: ActiveFiltersProps) {
    if (!dateRange && !amountRange) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap gap-2 mb-4"
        >
            {dateRange && (
                <button
                    onClick={onClearDateRange}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                >
                    <Calendar size={12} />
                    {format(new Date(dateRange.start), "dd/MM")} - {format(new Date(dateRange.end), "dd/MM")}
                    <X size={12} />
                </button>
            )}
            {amountRange && (
                <button
                    onClick={onClearAmountRange}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                >
                    Rp {amountRange.min.toLocaleString("id-ID")} - {amountRange.max.toLocaleString("id-ID")}
                    <X size={12} />
                </button>
            )}
            <button
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
                Hapus semua filter
            </button>
        </motion.div>
    );
}
