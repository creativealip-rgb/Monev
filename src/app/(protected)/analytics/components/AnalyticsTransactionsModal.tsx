"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Loader2, Tag, Wallet, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { apiFetch } from "@/frontend/lib/api-client";
import { formatCurrency, getPaymentMethod } from "@/frontend/lib/utils";
import type { TransactionWithCategory } from "@/types";
import type { AnalyticsDrilldownFilter } from "./types";

interface AnalyticsTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    filter: AnalyticsDrilldownFilter | null;
    accounts?: Array<{ id: number; name: string; type?: string }>;
    onFocusMap?: (filter: AnalyticsDrilldownFilter) => void;
}

function Portal({ children }: { children: React.ReactNode }) {
    if (typeof document === "undefined") {
        return null;
    }

    return createPortal(children, document.body);
}

export function AnalyticsTransactionsModal({
    isOpen,
    onClose,
    filter,
    accounts = [],
    onFocusMap,
}: AnalyticsTransactionsModalProps) {
    const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);
    const cacheRef = useRef<Map<string, TransactionWithCategory[]>>(new Map());
    const cacheKey = useMemo(() => JSON.stringify(filter || {}), [filter]);

    useEffect(() => {
        if (!isOpen || !filter) {
            return;
        }

        async function loadTransactions() {
            const cachedTransactions = cacheRef.current.get(cacheKey);
            if (cachedTransactions) {
                setTransactions(cachedTransactions);
                setError(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    limit: "20",
                    type: filter.type || "expense",
                });

                if (filter.categoryId) {
                    params.set("categoryId", String(filter.categoryId));
                }

                if (filter.accountId) {
                    params.set("accountId", String(filter.accountId));
                }

                if (filter.startDate) {
                    params.set("startDate", filter.startDate);
                }

                if (filter.endDate) {
                    params.set("endDate", filter.endDate);
                }

                const response = await apiFetch(`/api/transactions?${params.toString()}`);
                const json = await response.json();

                if (!response.ok || !json?.success) {
                    throw new Error("Gagal memuat transaksi.");
                }

                const nextTransactions = json.data || [];
                cacheRef.current.set(cacheKey, nextTransactions);
                setTransactions(nextTransactions);
            } catch (modalError) {
                console.error("Failed to load drilldown transactions:", modalError);
                setError("Tidak bisa memuat daftar transaksi.");
            } finally {
                setIsLoading(false);
            }
        }

        loadTransactions();
    }, [cacheKey, filter, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedTransaction(null);
        }
    }, [isOpen]);

    if (!isOpen || !filter) {
        return null;
    }

    const sourceAccount = selectedTransaction?.accountId
        ? accounts.find((account) => account.id === selectedTransaction.accountId)
        : null;
    const transactionsPageParams = new URLSearchParams();

    if (filter.type && filter.type !== "all") {
        transactionsPageParams.set("type", filter.type);
    }

    if (filter.categoryId) {
        transactionsPageParams.set("categoryId", String(filter.categoryId));
    }

    if (filter.accountId) {
        transactionsPageParams.set("accountId", String(filter.accountId));
    }

    if (filter.startDate) {
        transactionsPageParams.set("startDate", filter.startDate);
    }

    if (filter.endDate) {
        transactionsPageParams.set("endDate", filter.endDate);
    }

    const transactionsPageHref = `/transactions${transactionsPageParams.toString() ? `?${transactionsPageParams.toString()}` : ""}`;
    const canFocusMap = Boolean(onFocusMap && (filter.categoryId || filter.accountId));

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999999] flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-md md:items-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.98 }}
                        className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {selectedTransaction && (
                                        <button
                                            onClick={() => setSelectedTransaction(null)}
                                            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                        >
                                            <ArrowLeft size={14} />
                                        </button>
                                    )}
                                    <h3 className="truncate text-base font-black text-slate-900 dark:text-white">
                                        {selectedTransaction ? "Detail Transaksi" : filter.title}
                                    </h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {selectedTransaction
                                        ? "Rincian transaksi dari hasil analisis yang dipilih."
                                        : filter.description || "Daftar transaksi yang sesuai dengan analisis ini."}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {canFocusMap && (
                                    <button
                                        onClick={() => {
                                            onFocusMap?.(filter);
                                            onClose();
                                        }}
                                        className="rounded-full border border-emerald-200 px-3 py-1.5 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                                    >
                                        Fokus di Peta
                                    </button>
                                )}
                                <Link
                                    href={transactionsPageHref}
                                    onClick={onClose}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Buka di Riwayat
                                </Link>
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {selectedTransaction ? (
                            <div className="space-y-3">
                                <div className="rounded-3xl bg-slate-50 p-5 text-center dark:bg-slate-800/60">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Total Nominal
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {formatCurrency(selectedTransaction.amount)}
                                    </p>
                                    <div className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-slate-100 dark:text-slate-900">
                                        {selectedTransaction.type === "income" ? "Pemasukan" : selectedTransaction.type === "transfer" ? "Transfer" : "Pengeluaran"}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                                                <Tag size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Deskripsi
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                                                    {selectedTransaction.description}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {selectedTransaction.categoryName || "Tanpa kategori"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                    Waktu Transaksi
                                                </p>
                                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                                                    {format(new Date(selectedTransaction.date), "EEEE, d MMMM yyyy", { locale: id })}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Pukul {format(new Date(selectedTransaction.date), "HH:mm", { locale: id })} WIB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {(selectedTransaction.paymentMethod || sourceAccount) && (
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    <Wallet size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                        Sumber Dana
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                                                        {sourceAccount?.name || getPaymentMethod(selectedTransaction.paymentMethod).label}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {sourceAccount ? "Dari akun transaksi" : "Metode pembayaran"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="animate-spin text-slate-400" size={24} />
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-900/10 dark:text-rose-300">
                                {error}
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                Tidak ada transaksi yang cocok dengan filter ini.
                            </div>
                        ) : (
                            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                                {transactions.map((transaction) => (
                                    <button
                                        key={transaction.id}
                                        onClick={() => setSelectedTransaction(transaction)}
                                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                    {transaction.description}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                    {transaction.categoryName || "Tanpa kategori"} •{" "}
                                                    {format(new Date(transaction.date), "d MMM yyyy, HH:mm", { locale: id })}
                                                </p>
                                            </div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">
                                                {formatCurrency(transaction.amount)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}
