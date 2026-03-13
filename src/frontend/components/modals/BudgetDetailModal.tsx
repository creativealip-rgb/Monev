"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2 } from "lucide-react";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { BudgetSummary } from "@/types";

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

interface BudgetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: BudgetSummary | null;
    onEdit: (b: BudgetSummary) => void;
    onDelete: (id: number) => void;
}

export function BudgetDetailModal({ isOpen, onClose, budget, onEdit, onDelete }: BudgetDetailModalProps) {
    if (!isOpen || !budget) return null;

    const percentage = Math.round(budget.percentage);
    const isDanger = percentage > 90;
    const isWarning = percentage > 75;

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-5 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Detail Budget</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-xl shadow-sky-500/20">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">Kategori</span>
                                <h3 className="text-lg font-bold mb-3 tracking-tight">{budget.category}</h3>

                                <div className="space-y-1 mb-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="opacity-60">Pemakaian</span>
                                        <span className="text-cyan-200">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700",
                                                isDanger ? "bg-rose-400" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                                            )}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-3">
                                    <div>
                                        <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider block mb-0.5">Terpakai</span>
                                        <span className="font-bold text-sm tracking-tight tabular-nums">{formatCurrency(budget.spent)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider block mb-0.5">Limit</span>
                                        <span className="font-bold text-sm tracking-tight tabular-nums">{formatCurrency(budget.limit)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={() => onEdit(budget)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(budget.id)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={16} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}
