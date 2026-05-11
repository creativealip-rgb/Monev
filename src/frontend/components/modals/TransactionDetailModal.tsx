"use client";

import { useEffect, useRef } from "react";
import { Portal } from "@/frontend/components/Portal";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Tag, Wallet, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn, getPaymentMethod } from "@/frontend/lib/utils";
import { TransactionWithCategory } from "@/types";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionWithCategory | null;
    onEdit: (t: TransactionWithCategory) => void;
    onDelete: (id: number) => void;
    accounts?: { id: number; name: string; type: string }[];
}

const OPENING_BALANCE_PREFIX = "[OPENING_BALANCE]";
const BALANCE_ADJUSTMENT_PREFIX = "[BALANCE_ADJUSTMENT]";

function getBalanceAuditInfo(description?: string | null) {
    if (description?.startsWith(OPENING_BALANCE_PREFIX)) {
        return {
            label: "Saldo Awal",
            typeLabel: "Penyesuaian Saldo",
            displayDescription: description.replace(OPENING_BALANCE_PREFIX, "").trim() || "Saldo awal akun",
        };
    }

    if (description?.startsWith(BALANCE_ADJUSTMENT_PREFIX)) {
        return {
            label: "Penyesuaian Manual",
            typeLabel: "Penyesuaian Saldo",
            displayDescription: description.replace(BALANCE_ADJUSTMENT_PREFIX, "").trim() || "Penyesuaian saldo akun",
        };
    }

    return null;
}

export function TransactionDetailModal({ isOpen, onClose, transaction, onEdit, onDelete, accounts = [] }: TransactionDetailModalProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const editButtonRef = useRef<HTMLButtonElement>(null);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen || !transaction) return;

        const previousActiveElement = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key !== "Tab") return;

            const focusableElements = [closeButtonRef.current, editButtonRef.current, deleteButtonRef.current].filter(
                (element): element is HTMLButtonElement => Boolean(element),
            );
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
        document.body.classList.add("monev-transaction-modal-open");
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: true }));
        document.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keydown", handleKeyDown, true);
        window.setTimeout(() => closeButtonRef.current?.focus(), 0);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.classList.remove("monev-transaction-modal-open");
            document.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keydown", handleKeyDown, true);
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
            previousActiveElement?.focus?.();
        };
    }, [isOpen, onClose, transaction]);

    if (!isOpen || !transaction) return null;

    const sourceAccount = accounts.find(a => a.id === transaction.accountId);
    const balanceAudit = getBalanceAuditInfo(transaction.description);
    const displayDescription = balanceAudit?.displayDescription || transaction.description;
    const categoryLabel = balanceAudit?.typeLabel || transaction.categoryName || "Tanpa Kategori";

    return (
        <Portal>
            <style jsx global>{`
                body.monev-transaction-modal-open [data-bottom-nav],
                body.monev-transaction-modal-open nav[aria-label="Navigasi utama"],
                body.monev-transaction-modal-open [id*="chat-widget" i],
                body.monev-transaction-modal-open [class*="chat-widget" i] {
                    pointer-events: none !important;
                    visibility: hidden !important;
                }
            `}</style>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md dark:bg-slate-950/80"
                    style={{ height: "100dvh" }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 80, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 80, scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="transaction-detail-title"
                        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-h-[85vh] sm:rounded-[2.5rem]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 id="transaction-detail-title" className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Detail Transaksi</h2>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={onClose}
                                aria-label="Tutup detail transaksi"
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Total Nominal</span>
                                <h3 className={cn(
                                    "text-2xl font-bold tabular-nums tracking-tight",
                                    balanceAudit ? "text-amber-600 dark:text-amber-300" : transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                )}>
                                    {formatCurrency(transaction.amount)}
                                </h3>
                                <div className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mt-2",
                                    balanceAudit ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : transaction.type === 'income' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                )}>
                                    {balanceAudit?.label || (transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                                </div>
                                {balanceAudit && (
                                    <p className="mt-2 px-4 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Audit saldo ini tidak dihitung sebagai pemasukan atau pengeluaran di laporan.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                                        {balanceAudit ? <SlidersHorizontal size={16} aria-hidden="true" /> : <Tag size={16} aria-hidden="true" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-[13px] truncate">{displayDescription}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{categoryLabel}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                        <Calendar size={16} aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-[13px]">
                                            {format(new Date(transaction.createdAt), "d MMMM yyyy", { locale: id })}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Pukul {format(new Date(transaction.createdAt), "HH:mm")} WIB
                                        </p>
                                    </div>
                                </div>

                                {(transaction.paymentMethod || transaction.accountId) && (
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            <Wallet size={16} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-[13px]">
                                                {transaction.accountId && sourceAccount
                                                    ? sourceAccount.name
                                                    : getPaymentMethod(transaction.paymentMethod).label}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {transaction.accountId ? "Dari Akun" : "Metode Pembayaran"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {transaction.isVerified && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Terverifikasi AI
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    ref={editButtonRef}
                                    type="button"
                                    onClick={() => onEdit(transaction)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                                >
                                    <Edit2 size={16} aria-hidden="true" />
                                    Edit
                                </button>
                                <button
                                    ref={deleteButtonRef}
                                    type="button"
                                    onClick={() => onDelete(transaction.id)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                                >
                                    <Trash2 size={16} aria-hidden="true" />
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
