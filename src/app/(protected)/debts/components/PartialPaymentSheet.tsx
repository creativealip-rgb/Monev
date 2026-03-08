"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { Debt } from "../types";
import { getDebtAmounts, addOrigTag } from "../utils";

export function PartialPaymentSheet({
    debt,
    onClose,
    onSuccess,
}: {
    debt: Debt | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [paymentAmount, setPaymentAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const { originalAmount, remainingAmount } = debt
        ? getDebtAmounts(debt)
        : { originalAmount: 0, remainingAmount: 0 };

    const parsedAmount = parseFloat(paymentAmount) || 0;
    const isValid = parsedAmount > 0 && parsedAmount <= remainingAmount;
    const isFullPayment = parsedAmount === remainingAmount;

    const handleSubmit = async () => {
        if (!debt || !isValid) return;
        setLoading(true);
        try {
            const newRemaining = remainingAmount - parsedAmount;
            const descWithOrig = addOrigTag(
                debt.description,
                originalAmount
            );

            if (newRemaining <= 0) {
                const res = await apiFetch(`/api/debts/${debt.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: "paid",
                        description: descWithOrig,
                        direction: debt.direction,
                    }),
                });
                const result = await res.json();
                if (!result.success && !res.ok) {
                    toast.error("Gagal", "Gagal memperbarui data");
                    return;
                }
                toast.success(
                    "Lunas!",
                    `${debt.debtorName} sudah lunas sepenuhnya`
                );
            } else {
                const res = await apiFetch(`/api/debts/${debt.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: newRemaining,
                        description: descWithOrig,
                        direction: debt.direction,
                    }),
                });
                const result = await res.json();
                if (!result.success && !res.ok) {
                    toast.error("Gagal", "Gagal memperbarui data");
                    return;
                }
                toast.success(
                    "Pembayaran Dicatat",
                    `Sisa: ${formatCurrency(newRemaining)}`
                );
            }
            setPaymentAmount("");
            onClose();
            onSuccess();
        } catch {
            toast.error("Gagal", "Coba lagi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {debt && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">Bayar Sebagian</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 rounded-2xl mb-5 bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-sm font-bold text-foreground">{debt.debtorName}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">Total hutang</span>
                                    <span className="text-sm font-bold text-foreground">{formatCurrency(originalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">Sisa belum dibayar</span>
                                    <span className={cn("text-sm font-bold", debt.direction === "owe" ? "text-rose-600" : "text-sky-600")}>
                                        {formatCurrency(remainingAmount)}
                                    </span>
                                </div>
                                {originalAmount !== remainingAmount && (
                                    <div className="mt-3">
                                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", debt.direction === "owe" ? "bg-rose-400" : "bg-sky-400")}
                                                style={{ width: `${Math.round(((originalAmount - remainingAmount) / originalAmount) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Jumlah Pembayaran (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-amber-500 focus:outline-none transition-colors text-sm"
                                        placeholder={`Maks ${formatCurrency(remainingAmount)}`}
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        max={remainingAmount}
                                        min={1}
                                    />
                                    {paymentAmount && !isValid && (
                                        <p className="text-xs text-red-500 mt-1.5">
                                            {parsedAmount <= 0 ? "Jumlah harus lebih dari 0" : `Maksimal ${formatCurrency(remainingAmount)}`}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {[0.25, 0.5, 0.75, 1].map(fraction => {
                                        const val = Math.round(remainingAmount * fraction);
                                        const label = fraction === 1 ? "Semua" : `${fraction * 100}%`;
                                        return (
                                            <button
                                                key={fraction}
                                                onClick={() => setPaymentAmount(String(val))}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                                    parsedAmount === val
                                                        ? "bg-amber-500 text-white"
                                                        : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !isValid}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                        "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20",
                                        (loading || !isValid) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {loading
                                        ? "Memproses..."
                                        : isFullPayment
                                            ? "Bayar Lunas"
                                            : `Bayar ${parsedAmount > 0 ? formatCurrency(parsedAmount) : ""}`}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}