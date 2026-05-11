"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, DollarSign, AlertCircle, CheckCircle, Receipt } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { useToast } from "@/frontend/components/UI";
import { AccountIcon } from "@/frontend/components/AccountIcon";
import { Bill } from "@/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PayBillModal");

interface PayBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
    paidAmount?: number;
    onSuccess: () => void;
}

export function PayBillModal({ isOpen, onClose, bill, paidAmount = 0, onSuccess }: PayBillModalProps) {
    const { accounts, isLoading: accountsLoading } = useAccountsData();
    const toast = useToast();
    
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    // Calculate remaining amount
    const remainingAmount = bill ? Math.max(0, bill.amount - paidAmount) : 0;

    useEffect(() => {
        if (isOpen && bill) {
            setAmount(remainingAmount.toString());
            setSelectedAccountId(accounts[0]?.id?.toString() || "");
            setError(null);
            setNotes("");
        }
    }, [isOpen, bill, remainingAmount, accounts]);

    useEffect(() => {
        if (!isOpen || !bill) return;

        const previousActiveElement = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isSubmitting) {
                onClose();
                return;
            }

            if (event.key !== "Tab") return;

            const focusableElements: HTMLElement[] = [
                closeButtonRef.current,
                amountInputRef.current,
                cancelButtonRef.current,
                submitButtonRef.current,
            ].filter(Boolean) as HTMLElement[];
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (!firstElement || !lastElement) return;

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown, true);
        window.setTimeout(() => amountInputRef.current?.focus(), 0);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown, true);
            previousActiveElement?.focus?.();
        };
    }, [isOpen, bill, isSubmitting, onClose]);

    if (!isOpen || !bill) return null;

    const selectedAccount = accounts.find(a => a.id.toString() === selectedAccountId);
    const hasInsufficientBalance = selectedAccount && parseFloat(amount) > selectedAccount.balance;
    const canSubmit = selectedAccountId && parseFloat(amount) > 0 && !hasInsufficientBalance && !isSubmitting;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || !bill) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await apiFetch(`/api/bills/${bill.id}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId: parseInt(selectedAccountId),
                    amount: parseFloat(amount),
                    notes: notes || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(
                    parseFloat(amount) >= bill.amount ? "Tagihan lunas!" : "Pembayaran berhasil",
                    parseFloat(amount) >= bill.amount 
                        ? `${bill.name} telah dibayar lunas` 
                        : `Pembayaran ${formatCurrency(parseFloat(amount))} berhasil dicatat`
                );
                onSuccess();
                onClose();
            } else {
                setError(result.error || "Gagal memproses pembayaran");
                toast.error("Pembayaran gagal", result.error || "Terjadi kesalahan");
            }
        } catch (err) {
            logger.error("Error paying bill", err);
            setError("Terjadi kesalahan saat memproses pembayaran");
            toast.error("Pembayaran gagal", "Coba lagi nanti");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pay-bill-title"
                    aria-describedby="pay-bill-description"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: bill.color + "20" }}
                            >
                                <Receipt size={20} style={{ color: bill.color }} aria-hidden="true" />
                            </div>
                            <div>
                                <h2 id="pay-bill-title" className="text-lg font-bold text-foreground">Bayar Tagihan</h2>
                                <p id="pay-bill-description" className="text-xs text-muted-foreground">{bill.name}</p>
                            </div>
                        </div>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={onClose}
                            aria-label="Tutup pembayaran tagihan"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                        >
                            <X size={20} className="text-slate-500" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Bill Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Total Tagihan</span>
                            <span className="font-bold text-foreground">{formatCurrency(bill.amount)}</span>
                        </div>
                        {paidAmount > 0 && (
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-emerald-600">Sudah Dibayar</span>
                                <span className="font-bold text-emerald-600">-{formatCurrency(paidAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-foreground">Sisa</span>
                            <span className="font-bold text-rose-500">{formatCurrency(remainingAmount)}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Account Selection */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                                <Wallet size={16} aria-hidden="true" />
                                Pilih Rekening
                            </label>
                            {accountsLoading ? (
                                <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                            ) : accounts.length === 0 ? (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 text-sm">
                                    Tidak ada rekening. Tambahkan rekening terlebih dahulu.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {accounts.map((account) => (
                                        <button
                                            key={account.id}
                                            type="button"
                                            onClick={() => setSelectedAccountId(account.id.toString())}
                                            className={cn(
                                                "w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                                                selectedAccountId === account.id.toString()
                                                    ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                            )}
                                        >
                                            <div 
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: account.color + "20" }}
                                            >
                                                <AccountIcon name={account.icon} color={account.color} size={20} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-sm">{account.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(account.balance)}
                                                </p>
                                            </div>
                                            {selectedAccountId === account.id.toString() && (
                                                <CheckCircle size={18} className="text-sky-500" aria-hidden="true" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                                <DollarSign size={16} aria-hidden="true" />
                                Jumlah Pembayaran
                            </label>
                            <div className="relative">
                                <input
                                    ref={amountInputRef}
                                    aria-label="Jumlah pembayaran"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Masukkan jumlah"
                                    max={remainingAmount}
                                    min={1}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-foreground",
                                        "focus:outline-none focus:ring-0 transition-colors",
                                        hasInsufficientBalance
                                            ? "border-rose-300 focus:border-rose-500"
                                            : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setAmount(remainingAmount.toString())}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-xs font-medium text-sky-500 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                                >
                                    Bayar Lunas
                                </button>
                            </div>
                            {hasInsufficientBalance && selectedAccount && (
                                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} aria-hidden="true" />
                                    Saldo tidak cukup. Saldo: {formatCurrency(selectedAccount.balance)}
                                </p>
                            )}
                        </div>

                        {/* Notes Input */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Catatan (Opsional)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Bayar listrik Januari"
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 text-sm flex items-center gap-2">
                                <AlertCircle size={16} aria-hidden="true" />
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-2">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                            >
                                Batal
                            </button>
                            <button
                                ref={submitButtonRef}
                                type="submit"
                                disabled={!canSubmit}
                                className={cn(
                                    "flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                                    canSubmit
                                        ? "bg-sky-500 hover:bg-sky-600 active:scale-95"
                                        : "bg-slate-300 cursor-not-allowed"
                                )}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Memproses...
                                    </span>
                                ) : (
                                    `Bayar ${formatCurrency(parseFloat(amount || "0"))}`
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
