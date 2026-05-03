"use client";

import { Calendar, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { DateRange, AmountRange } from "../types";

interface ActiveFiltersProps {
    accountName?: string | null;
    dateRange: DateRange | null;
    amountRange: AmountRange | null;
    onClearAccount?: () => void;
    onClearDateRange: () => void;
    onClearAmountRange: () => void;
    onClearAll: () => void;
}

export function ActiveFilters({
    accountName,
    dateRange,
    amountRange,
    onClearAccount,
    onClearDateRange,
    onClearAmountRange,
    onClearAll,
}: ActiveFiltersProps) {
    if (!accountName && !dateRange && !amountRange) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-wrap gap-2 mb-4"
        >
            {accountName && onClearAccount && (
                <button
                    type="button"
                    onClick={onClearAccount}
                    aria-label={`Hapus filter akun ${accountName}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                >
                    Akun: {accountName}
                    <X size={12} />
                </button>
            )}
            {dateRange && (
                <button
                    type="button"
                    onClick={onClearDateRange}
                    aria-label="Hapus filter rentang tanggal"
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                >
                    <Calendar size={12} />
                    {format(new Date(dateRange.start), "dd/MM")} - {format(new Date(dateRange.end), "dd/MM")}
                    <X size={12} />
                </button>
            )}
            {amountRange && (
                <button
                    type="button"
                    onClick={onClearAmountRange}
                    aria-label="Hapus filter rentang nominal"
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-xs font-medium text-sky-600 dark:text-sky-400"
                >
                    Rp {amountRange.min.toLocaleString("id-ID")} - {amountRange.max.toLocaleString("id-ID")}
                    <X size={12} />
                </button>
            )}
            <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
                Hapus semua filter
            </button>
        </motion.div>
    );
}
