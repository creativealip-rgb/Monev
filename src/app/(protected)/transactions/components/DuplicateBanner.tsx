"use client";

import { AlertTriangle, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface DuplicateBannerProps {
    duplicateCount: number;
    showDuplicatesOnly: boolean;
    onToggleDuplicates: () => void;
    onDismiss: () => void;
    loading: boolean;
}

export function DuplicateBanner({
    duplicateCount,
    showDuplicatesOnly,
    onToggleDuplicates,
    onDismiss,
    loading,
}: DuplicateBannerProps) {
    return (
        <AnimatePresence mode="wait">
            {!loading && duplicateCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl",
                            "bg-amber-50 dark:bg-amber-900/20",
                            "border border-amber-200 dark:border-amber-800/50"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="flex-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            Ditemukan {duplicateCount} transaksi yang mungkin duplikat
                        </p>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={onToggleDuplicates}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                                showDuplicatesOnly
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                            )}
                        >
                            <Eye size={14} />
                            {showDuplicatesOnly ? "Lihat Semua" : "Lihat"}
                        </motion.button>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={onDismiss}
                            aria-label="Abaikan peringatan duplikat"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Abaikan duplikat ini"
                        >
                            <X size={14} />
                            Abaikan
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
