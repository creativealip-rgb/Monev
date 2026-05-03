"use client";

import { Undo2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { TransactionWithCategory } from "@/types";

interface UndoBannerProps {
    show: boolean;
    countdown: number;
    isRestoring: boolean;
    transaction: TransactionWithCategory | null;
    onUndo: () => void;
    onDismiss: () => void;
}

export function UndoBanner({
    show,
    countdown,
    isRestoring,
    transaction,
    onUndo,
    onDismiss,
}: UndoBannerProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                    }}
                    className="fixed bottom-24 left-4 right-4 z-[9999] max-w-[500px] mx-auto"
                >
                    <div
                        className={cn(
                            "bg-slate-900 dark:bg-slate-800",
                            "rounded-2xl shadow-2xl",
                            "border border-slate-700/50",
                            "px-4 py-3.5",
                            "flex items-center gap-3"
                        )}
                    >
                        {/* Progress ring */}
                        <div className="relative w-9 h-9 flex-shrink-0">
                            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-slate-700"
                                />
                                <motion.circle
                                    cx="18"
                                    cy="18"
                                    r="15"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className="text-amber-400"
                                    strokeDasharray={2 * Math.PI * 15}
                                    initial={{ strokeDashoffset: 0 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 15 }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {countdown}
                            </span>
                        </div>

                        {/* Message */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                                Transaksi dihapus
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {transaction?.description || "Transaksi"}
                                {" \u2022 "}
                                {formatCurrency(transaction?.amount ?? 0)}
                            </p>
                        </div>

                        {/* Undo button */}
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onUndo}
                            disabled={isRestoring}
                            className={cn(
                                "flex items-center gap-1.5",
                                "px-4 py-2 rounded-xl",
                                "text-sm font-bold",
                                "transition-colors",
                                isRestoring
                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                    : "bg-amber-500 text-slate-900 hover:bg-amber-400 active:bg-amber-600"
                            )}
                        >
                            {isRestoring ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Undo2 size={16} />
                            )}
                            Batalkan
                        </motion.button>

                        {/* Dismiss */}
                        <button
                            type="button"
                            onClick={onDismiss}
                            aria-label="Tutup pemberitahuan transaksi dihapus"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
