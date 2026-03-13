"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency } from "@/frontend/lib/utils";
import { Bill, BillPayment } from "@/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("BillDetailModal");

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

interface BillHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
}

export function BillHistoryModal({ isOpen, onClose, bill }: BillHistoryModalProps) {
    const [history, setHistory] = useState<BillPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && bill) {
            loadHistory();
        }
    }, [isOpen, bill]);

    async function loadHistory() {
        if (!bill) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/bills/${bill.id}/history`);
            const result = await res.json();
            if (result.success) {
                setHistory(result.data);
            }
        } catch (error) {
            logger.error("Error loading bill history", error);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen || !bill) return null;

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
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Riwayat Pembayaran</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: bill.color + "20" }}>
                                    <span style={{ color: bill.color }} className="font-bold">{bill.icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{bill.name}</h3>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(bill.amount)} / {bill.frequency}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Log Pembayaran</h4>

                                {loading ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">Memuat riwayat...</div>
                                ) : history.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        Belum ada riwayat pembayaran tercatat.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {history.map((item, i) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                        <Check size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-foreground">
                                                            {format(new Date(item.paidAt), "d MMMM yyyy", { locale: id })}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">{item.notes || "Pembayaran lunas"}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[12px] font-bold text-foreground tabular-nums">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}
