"use client";

import { useState, useEffect } from "react";
import { X, Wallet, AlertCircle, CheckCircle, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { AccountIcon } from "@/frontend/components/AccountIcon";
import { Bill } from "@/types";

interface PayBillSheetProps {
    bill: Bill | null;
    paidAmount: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function PayBillSheet({
    bill,
    paidAmount,
    onClose,
    onSuccess,
}: PayBillSheetProps) {
    const { accounts, isLoading: accountsLoading } = useAccountsData();
    const toast = useToast();

    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate remaining amount
    const remainingAmount = bill ? Math.max(0, bill.amount - paidAmount) : 0;

    useEffect(() => {
        if (bill) {
            setSelectedAccountId(accounts[0]?.id?.toString() || "");
            setError(null);
            setNotes("");
        }
    }, [bill, accounts]);

    const selectedAccount = accounts.find(a => a.id.toString() === selectedAccountId);
    const hasInsufficientBalance = selectedAccount && remainingAmount > selectedAccount.balance;
    const canSubmit = selectedAccountId && !hasInsufficientBalance && !isSubmitting;

    async function handleSubmit() {
        if (!canSubmit || !bill) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await apiFetch(`/api/bills/${bill.id}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId: parseInt(selectedAccountId),
                    amount: remainingAmount,
                    notes: notes || undefined,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(
                    "Tagihan lunas!",
                    `${bill.name} telah dibayar lunas`
                );
                onSuccess();
                onClose();
            } else {
                setError(result.error || "Gagal memproses pembayaran");
                toast.error("Pembayaran gagal", result.error || "Terjadi kesalahan");
            }
        } catch (err) {
            console.error("Error paying bill:", err);
            setError("Terjadi kesalahan saat memproses pembayaran");
            toast.error("Pembayaran gagal", "Coba lagi nanti");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Portal>
            <AnimatePresence>
                {bill && (
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
                            className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem] p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: bill.color + "20" }}
                                    >
                                        <Receipt size={20} style={{ color: bill.color }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Bayar Tagihan</h2>
                                        <p className="text-xs text-muted-foreground">{bill.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Total Amount Display */}
                            <div className="text-center mb-6">
                                <p className="text-sm text-muted-foreground mb-1">Total yang harus dibayar</p>
                                <p className="text-3xl font-bold text-foreground">{formatCurrency(remainingAmount)}</p>
                                {paidAmount > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Sudah dibayar: {formatCurrency(paidAmount)} dari {formatCurrency(bill.amount)}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Account Selection */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block flex items-center gap-2">
                                        <Wallet size={16} />
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
                                                        "w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                                                        selectedAccountId === account.id.toString()
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                                                            : "border-slate-100 dark:border-slate-700 hover:border-slate-300"
                                                    )}
                                                >
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: account.color + "20" }}
                                                    >
                                                        <AccountIcon name={account.icon} color={account.color} size={20} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-sm font-bold text-foreground">{account.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatCurrency(account.balance)}
                                                        </p>
                                                    </div>
                                                    {selectedAccountId === account.id.toString() && (
                                                        <CheckCircle size={18} className="text-sky-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {hasInsufficientBalance && selectedAccount && (
                                        <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            Saldo tidak cukup. Saldo: {formatCurrency(selectedAccount.balance)}
                                        </p>
                                    )}
                                </div>

                                {/* Notes Input */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Catatan <span className="normal-case font-medium text-muted-foreground">(opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Contoh: Bayar listrik Januari"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground focus:outline-none focus:border-sky-500 transition-colors text-sm"
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                        canSubmit
                                            ? "bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                                            : "bg-slate-300 cursor-not-allowed"
                                    )}
                                >
                                    {isSubmitting
                                        ? "Memproses..."
                                        : `Bayar ${formatCurrency(remainingAmount)}`}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}
