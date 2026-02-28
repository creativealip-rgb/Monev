"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Portal } from "./Portal";
import { cn } from "@/frontend/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning";
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    loading = false,
    confirmText = "Hapus",
    cancelText = "Batal",
    type = "danger"
}: ConfirmDialogProps) {
    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[999998] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
                            onClick={loading ? undefined : onClose}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative focus:outline-none overflow-hidden"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={cn(
                                        "w-16 h-16 rounded-3xl flex items-center justify-center mb-4",
                                        type === "danger"
                                            ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500"
                                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-500"
                                    )}>
                                        <AlertTriangle size={32} />
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                                    <p className="text-sm text-muted-foreground mb-8">
                                        {description}
                                    </p>

                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={onConfirm}
                                            disabled={loading}
                                            className={cn(
                                                "w-full py-3.5 rounded-2xl font-bold text-white transition-all active:scale-[0.98]",
                                                type === "danger"
                                                    ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/25"
                                                    : "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/25",
                                                loading && "opacity-70 cursor-not-allowed"
                                            )}
                                        >
                                            {loading ? "Memproses..." : confirmText}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-2xl font-bold text-foreground bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            {cancelText}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}
