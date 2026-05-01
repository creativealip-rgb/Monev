"use client";

import { useState, useEffect } from "react";
import { X, Wallet } from "lucide-react";
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
    const [payFromBalance, setPayFromBalance] = useState(false);
    const [balance, setBalance] = useState(0);
    const toast = useToast();

    const { originalAmount, remainingAmount } = debt
        ? getDebtAmounts(debt)
        : { originalAmount: 0, remainingAmount: 0 };

    const parsedAmount = parseFloat(paymentAmount) || 0;
    const isValid = parsedAmount > 0 && parsedAmount <= remainingAmount;
    const isFullPayment = parsedAmount === remainingAmount;
    const isOwe = debt?.direction === "owe";
    const hasEnoughBalance = balance >= parsedAmount;

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const sanitizeNumberInput = (value: string) => value.replace(/[^0-9.]/g, "");

    useEffect(() => {
        if (!debt) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [debt, loading]);

    useEffect(() => {
        if (debt && isOwe) {
            apiFetch("/api/balance")
                .then(res => res.json())
                .then(data => {
                    if (data.success && typeof data.data === "number") {
                        setBalance(data.data);
                    }
                })
                .catch(() => undefined);
        }
    }, [debt, isOwe]);

    const handleSubmit = async () => {
        if (loading || !debt || !isValid) return;
        if (isOwe && payFromBalance && !hasEnoughBalance) {
            toast.error("Saldo Tidak Cukup", "Saldo kamu tidak cukup untuk membayar hutang ini");
            return;
        }
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
                        payFromBalance: isOwe ? payFromBalance : false,
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
                        payFromBalance: isOwe ? payFromBalance : false,
                        paymentAmount: isOwe && payFromBalance ? parsedAmount : undefined,
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
            setPayFromBalance(false);
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
                            onClick={handleClose}
                            aria-hidden="true"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem] p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="partial-payment-sheet-title"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="partial-payment-sheet-title" className="text-xl font-bold text-foreground">
                                    {isOwe ? "Bayar Hutang" : "Catat Pembayaran Piutang"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    aria-label="Tutup form pembayaran hutang atau piutang"
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
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
                                        inputMode="decimal"
                                        onChange={e => setPaymentAmount(sanitizeNumberInput(e.target.value))}
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
                                                type="button"
                                                aria-pressed={parsedAmount === val}
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

                                {isOwe && parsedAmount > 0 && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">Bayar dari Saldo</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Saldo: {formatCurrency(balance)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={payFromBalance}
                                                onClick={() => setPayFromBalance(!payFromBalance)}
                                                className={cn(
                                                    "relative w-12 h-6 rounded-full transition-colors",
                                                    payFromBalance ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                                                        payFromBalance && "translate-x-6"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                        {payFromBalance && !hasEnoughBalance && (
                                            <p className="text-xs text-red-500 mt-2">
                                                Saldo tidak cukup untuk membayar
                                            </p>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || !isValid || (isOwe && payFromBalance && !hasEnoughBalance)}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                        "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20",
                                        (loading || !isValid || (isOwe && payFromBalance && !hasEnoughBalance)) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {loading
                                        ? "Memproses..."
                                        : isOwe && payFromBalance
                                            ? `Bayar dari Saldo ${parsedAmount > 0 ? formatCurrency(parsedAmount) : ""}`
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