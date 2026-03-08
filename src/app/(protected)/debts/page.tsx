"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft, Plus, Users, TrendingDown, TrendingUp, Check,
    Trash2, Calendar, Edit3, X, ChevronRight, Wallet, Banknote
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { useToast } from "@/frontend/components/UI";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";

interface Debt {
    id: number;
    debtorName: string;
    amount: number;
    description: string;
    dueDate: Date | null;
    status: "unpaid" | "paid";
    direction: "owe" | "owed";
    createdAt: Date;
}

// --- Partial payment helpers ---
// Original amount is stored in description as [ORIG:123456]
function parseOriginalAmount(description: string): number | null {
    const match = description?.match(/\[ORIG:(\d+(?:\.\d+)?)\]/);
    return match ? parseFloat(match[1]) : null;
}

function stripOrigTag(description: string): string {
    return (description || "").replace(/\s*\[ORIG:\d+(?:\.\d+)?\]/, "").trim();
}

function addOrigTag(description: string, originalAmount: number): string {
    // Only add if not already present
    if (/\[ORIG:\d+(?:\.\d+)?\]/.test(description || "")) return description;
    return `${description || ""} [ORIG:${originalAmount}]`.trim();
}

function getDebtAmounts(debt: Debt): {
    originalAmount: number;
    remainingAmount: number;
    paidAmount: number;
    hasPartialPayment: boolean;
} {
    const orig = parseOriginalAmount(debt.description);
    const originalAmount = orig ?? debt.amount;
    const remainingAmount = debt.amount;
    const paidAmount = originalAmount - remainingAmount;
    return {
        originalAmount,
        remainingAmount,
        paidAmount,
        hasPartialPayment: orig !== null && paidAmount > 0,
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
};

function DebtCard({
    debt,
    onMarkPaid,
    onDelete,
    onPartialPayment,
}: {
    debt: Debt;
    onMarkPaid: (id: number, status: "unpaid" | "paid", debt?: Debt) => void;
    onDelete: (id: number) => void;
    onPartialPayment: (debt: Debt) => void;
}) {
    const isOwe = debt.direction === "owe";
    const isPaid = debt.status === "paid";
    const hasDueDate = !!debt.dueDate;
    const isOverdue = hasDueDate && !isPaid && new Date(debt.dueDate!) < new Date();
    const { originalAmount, remainingAmount, paidAmount, hasPartialPayment } =
        getDebtAmounts(debt);
    const progressPercent = hasPartialPayment
        ? Math.round((paidAmount / originalAmount) * 100)
        : 0;
    const displayDescription = stripOrigTag(debt.description);

    return (
        <motion.div
            variants={itemVariants}
            layout
            className={cn(
                "card-clean p-4 border-l-4 transition-all",
                isPaid
                    ? "border-l-emerald-400 opacity-60"
                    : isOwe
                        ? "border-l-rose-400"
                        : "border-l-sky-400"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                        isPaid ? "bg-emerald-50 dark:bg-emerald-900/30"
                            : isOwe ? "bg-rose-50 dark:bg-rose-900/30"
                                : "bg-sky-50 dark:bg-sky-900/30"
                    )}>
                        {isOwe
                            ? <TrendingDown size={18} className="text-rose-500" />
                            : <TrendingUp size={18} className="text-sky-500" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">
                            {debt.debtorName}
                        </p>
                        {displayDescription && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {displayDescription}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {hasPartialPayment && !isPaid ? (
                                <span className={cn(
                                    "text-xs font-bold",
                                    isOwe ? "text-rose-600" : "text-sky-600"
                                )}>
                                    {formatCurrency(remainingAmount)}
                                    <span className="text-muted-foreground font-medium">
                                        {" / "}
                                        {formatCurrency(originalAmount)}
                                    </span>
                                </span>
                            ) : (
                                <span className={cn(
                                    "text-xs font-bold",
                                    isPaid
                                        ? "text-emerald-600"
                                        : isOwe
                                            ? "text-rose-600"
                                            : "text-sky-600"
                                )}>
                                    {formatCurrency(debt.amount)}
                                </span>
                            )}
                            {hasDueDate && (
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full",
                                    "font-medium flex items-center gap-1",
                                    isOverdue
                                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                                )}>
                                    <Calendar size={9} />
                                    {format(
                                        new Date(debt.dueDate!),
                                        "d MMM yy",
                                        { locale: id }
                                    )}
                                </span>
                            )}
                            {isPaid && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">
                                    Lunas
                                </span>
                            )}
                        </div>

                        {/* Progress bar for partial payments */}
                        {hasPartialPayment && !isPaid && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        Terbayar {progressPercent}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {formatCurrency(paidAmount)}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${progressPercent}%`
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: "easeOut"
                                        }}
                                        className={cn(
                                            "h-full rounded-full",
                                            isOwe
                                                ? "bg-rose-400"
                                                : "bg-sky-400"
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {!isPaid && (
                        <button
                            onClick={() => onPartialPayment(debt)}
                            className={cn(
                                "w-8 h-8 rounded-xl flex items-center",
                                "justify-center transition-colors",
                                isOwe
                                    ? "bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                    : "bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                            )}
                            title="Bayar Sebagian"
                        >
                            <Banknote
                                size={16}
                                className="text-amber-600"
                            />
                        </button>
                    )}
                    {!isPaid && (
                        <button
                            onClick={() => onMarkPaid(debt.id, "paid", debt)}
                            className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors"
                            title="Tandai Lunas"
                        >
                            <Check size={16} className="text-emerald-600" />
                        </button>
                    )}
                    {isPaid && (
                        <button
                            onClick={() => onMarkPaid(debt.id, "unpaid")}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                            title="Tandai Belum Lunas"
                        >
                            <X size={14} className="text-slate-500" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(debt.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                        title="Hapus"
                    >
                        <Trash2 size={14} className="text-red-500" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}


function AddDebtSheet({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [direction, setDirection] = useState<"owe" | "owed">("owe");
    const [debtorName, setDebtorName] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const reset = () => {
        setDebtorName(""); setAmount(""); setDescription(""); setDueDate(""); setDirection("owe");
    };

    const handleSubmit = async () => {
        if (!debtorName.trim() || !amount) return;
        setLoading(true);
        try {
            const res = await apiFetch("/api/debts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    debtorName,
                    amount: parseFloat(amount),
                    description,
                    dueDate: dueDate || null,
                    direction,
                }),
            });
            if (res.ok) {
                toast.success("Berhasil", direction === "owe" ? "Hutang dicatat!" : "Piutang dicatat!");
                reset();
                onClose();
                onSuccess();
            } else {
                toast.error("Gagal", "Coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">Catat Hutang / Piutang</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Direction Toggle */}
                            <div>
                                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jenis</label>
                                <div className="flex gap-2 mb-5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        onClick={() => setDirection("owe")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            direction === "owe"
                                                ? "bg-rose-500 text-white shadow-sm"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        Saya Berhutang
                                    </button>
                                    <button
                                        onClick={() => setDirection("owed")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            direction === "owed"
                                                ? "bg-sky-500 text-white shadow-sm"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        Saya Diutangi
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        {direction === "owe" ? "Nama Kreditur" : "Nama Debitur"}
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="Contoh: Pak Budi / Shopee Paylater"
                                        value={debtorName}
                                        onChange={e => setDebtorName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="500000"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Keterangan <span className="normal-case font-medium text-muted-foreground">(opsional)</span></label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="Bayar makan siang, pinjam uang bensin..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jatuh Tempo <span className="normal-case font-medium text-muted-foreground">(opsional)</span></label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !debtorName.trim() || !amount}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                        direction === "owe"
                                            ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                                            : "bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20",
                                        (loading || !debtorName.trim() || !amount) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {loading ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}

function PartialPaymentSheet({
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
                // Fully paid — mark as paid, update description
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
                // Partial — reduce amount, keep unpaid
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
                            className={cn(
                                "fixed inset-0 bg-slate-900/60",
                                "dark:bg-slate-950/80 backdrop-blur-md",
                                "z-[999998]"
                            )}
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                            }}
                            className={cn(
                                "fixed bottom-0 left-0 right-0",
                                "z-[999999] bg-white dark:bg-slate-900",
                                "rounded-t-[2.5rem] p-8 pb-12",
                                "max-h-[90vh] overflow-y-auto",
                                "border border-slate-200",
                                "dark:border-slate-700 shadow-2xl",
                                "max-w-[500px] mx-auto"
                            )}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">
                                    Bayar Sebagian
                                </h2>
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "w-10 h-10 rounded-full",
                                        "bg-slate-100 dark:bg-slate-800",
                                        "flex items-center justify-center",
                                        "text-slate-500 dark:text-slate-400",
                                        "hover:bg-slate-200",
                                        "dark:hover:bg-slate-700",
                                        "transition-colors"
                                    )}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Debt info summary */}
                            <div className={cn(
                                "p-4 rounded-2xl mb-5",
                                "bg-slate-50 dark:bg-slate-800/50"
                            )}>
                                <p className="text-sm font-bold text-foreground">
                                    {debt.debtorName}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">
                                        Total hutang
                                    </span>
                                    <span className="text-sm font-bold text-foreground">
                                        {formatCurrency(originalAmount)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        Sisa belum dibayar
                                    </span>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        debt.direction === "owe"
                                            ? "text-rose-600"
                                            : "text-sky-600"
                                    )}>
                                        {formatCurrency(remainingAmount)}
                                    </span>
                                </div>
                                {originalAmount !== remainingAmount && (
                                    <div className="mt-3">
                                        <div className={cn(
                                            "w-full h-2 rounded-full",
                                            "bg-slate-200 dark:bg-slate-700",
                                            "overflow-hidden"
                                        )}>
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    debt.direction === "owe"
                                                        ? "bg-rose-400"
                                                        : "bg-sky-400"
                                                )}
                                                style={{
                                                    width: `${Math.round(
                                                        ((originalAmount - remainingAmount)
                                                            / originalAmount) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={cn(
                                        "text-xs font-bold text-foreground",
                                        "uppercase tracking-wider mb-2 block"
                                    )}>
                                        Jumlah Pembayaran (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        className={cn(
                                            "w-full px-4 py-3 rounded-xl",
                                            "border-2 border-slate-100",
                                            "dark:border-slate-700",
                                            "dark:bg-slate-800 dark:text-white",
                                            "focus:border-amber-500",
                                            "focus:outline-none transition-colors",
                                            "text-sm"
                                        )}
                                        placeholder={`Maks ${formatCurrency(remainingAmount)}`}
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(
                                            e.target.value
                                        )}
                                        max={remainingAmount}
                                        min={1}
                                    />
                                    {paymentAmount && !isValid && (
                                        <p className="text-xs text-red-500 mt-1.5">
                                            {parsedAmount <= 0
                                                ? "Jumlah harus lebih dari 0"
                                                : `Maksimal ${formatCurrency(remainingAmount)}`}
                                        </p>
                                    )}
                                </div>

                                {/* Quick amount buttons */}
                                <div className="flex gap-2 flex-wrap">
                                    {[0.25, 0.5, 0.75, 1].map(fraction => {
                                        const val = Math.round(
                                            remainingAmount * fraction
                                        );
                                        const label = fraction === 1
                                            ? "Semua"
                                            : `${fraction * 100}%`;
                                        return (
                                            <button
                                                key={fraction}
                                                onClick={() => setPaymentAmount(
                                                    String(val)
                                                )}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl",
                                                    "text-xs font-bold",
                                                    "transition-all",
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
                                        "w-full py-4 rounded-xl font-bold",
                                        "text-white text-sm mt-2 transition-all",
                                        "bg-amber-500 hover:bg-amber-600",
                                        "shadow-lg shadow-amber-500/20",
                                        (loading || !isValid) &&
                                            "opacity-50 cursor-not-allowed"
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

export default function DebtsPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<"unpaid" | "paid">("unpaid");
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [settleDialog, setSettleDialog] = useState<{ debt: Debt } | null>(null);
    const [partialPaymentDebt, setPartialPaymentDebt] = useState<Debt | null>(null);
    const toast = useToast();

    const loadDebts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/api/debts");
            const data = await res.json();
            if (data.success) setDebts(data.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDebts(); }, [loadDebts]);

    const handleMarkPaid = async (id: number, status: "paid" | "unpaid", debt?: Debt) => {
        if (status === "paid" && debt && debt.direction === "owed") {
            // For piutang (money owed TO user) — show settle dialog
            setSettleDialog({ debt });
            return;
        }
        // For hutang OR plain status toggle — just update status
        try {
            const res = await apiFetch(`/api/debts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const result = await res.json();
            if (result.success || res.ok) {
                toast.success(status === "paid" ? "Lunas!" : "Dibatalkan", "Status diperbarui");
            } else {
                toast.error("Gagal", result.error || "Gagal memperbarui status");
            }
            await loadDebts();
        } catch {
            toast.error("Gagal", "Coba lagi");
        }
    };

    const handleSettle = async (createTx: boolean) => {
        if (!settleDialog) return;
        try {
            const res = await apiFetch("/api/debts/settle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ debtId: settleDialog.debt.id, createTx }),
            });
            if (res.ok) {
                toast.success("Lunas!", createTx ? "Saldo bertambah sesuai piutang" : "Ditandai lunas");
            } else {
                toast.error("Gagal", "Gagal memproses pelunasan");
            }
        } catch {
            toast.error("Gagal", "Coba lagi");
        }
        setSettleDialog(null);
        await loadDebts();
    };

    const handleDelete = (id: number) => {
        setConfirmDeleteId(id);
    };

    const executeDelete = async (id: number) => {
        setDeletingId(id);
        try {
            const res = await apiFetch(`/api/debts/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success || res.ok) {
                toast.success("Dihapus", "Catatan hutang dihapus");
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus");
            }
            await loadDebts();
        } catch {
            toast.error("Gagal", "Coba lagi");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const filtered = debts.filter(d => d.status === activeTab);
    const unpaid = debts.filter(d => d.status === "unpaid");
    const oweUnpaid = unpaid.filter(d => d.direction === "owe");
    const owedUnpaid = unpaid.filter(d => d.direction === "owed");
    const totalOwe = oweUnpaid.reduce((s, d) => s + d.amount, 0);
    const totalOwed = owedUnpaid.reduce((s, d) => s + d.amount, 0);
    const netBalance = totalOwed - totalOwe;

    return (
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Hutang & Piutang</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Catat semua pinjaman</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddSheet(true)}
                        className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <div className="px-6 pt-6 space-y-5">
                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <div className="card-clean p-4 text-center">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-2">
                            <TrendingDown size={16} className="text-rose-500" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hutang</p>
                        <p className="text-sm font-black text-rose-600 mt-0.5 tabular-nums">
                            {formatCurrency(totalOwe).replace("Rp", "")}
                        </p>
                    </div>
                    <div className={cn(
                        "card-clean p-4 text-center border-2",
                        netBalance >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-rose-200 dark:border-rose-800"
                    )}>
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2",
                            netBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/30"
                        )}>
                            <Wallet size={16} className={netBalance >= 0 ? "text-emerald-500" : "text-rose-500"} />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net</p>
                        <p className={cn("text-sm font-black mt-0.5 tabular-nums", netBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {netBalance >= 0 ? "+" : ""}{formatCurrency(Math.abs(netBalance)).replace("Rp", "")}
                        </p>
                    </div>
                    <div className="card-clean p-4 text-center">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-2">
                            <TrendingUp size={16} className="text-sky-500" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Piutang</p>
                        <p className="text-sm font-black text-sky-600 mt-0.5 tabular-nums">
                            {formatCurrency(totalOwed).replace("Rp", "")}
                        </p>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                    {(["unpaid", "paid"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                                activeTab === tab
                                    ? "bg-white dark:bg-slate-900 text-foreground shadow-sm"
                                    : "text-muted-foreground"
                            )}
                        >
                            {tab === "unpaid" ? `Aktif (${unpaid.length})` : "Lunas"}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Users size={32} className="text-slate-400" />
                        </div>
                        <p className="font-bold text-foreground mb-1">
                            {activeTab === "unpaid" ? "Tidak ada hutang aktif" : "Belum ada yang lunas"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {activeTab === "unpaid" ? "Tap + untuk mencatat hutang atau piutang baru" : "Tandai hutang sebagai lunas dari tab Aktif"}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        <AnimatePresence>
                            {filtered.map(debt => (
                                <DebtCard
                                    key={debt.id}
                                    debt={debt}
                                    onMarkPaid={handleMarkPaid}
                                    onDelete={handleDelete}
                                    onPartialPayment={setPartialPaymentDebt}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <AddDebtSheet
                isOpen={showAddSheet}
                onClose={() => setShowAddSheet(false)}
                onSuccess={loadDebts}
            />

            <PartialPaymentSheet
                debt={partialPaymentDebt}
                onClose={() => setPartialPaymentDebt(null)}
                onSuccess={loadDebts}
            />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
                title="Hapus Catatan"
                description="Catatan hutang/piutang ini akan dihapus secara permanen. Lanjutkan?"
                loading={!!deletingId}
            />

            {/* Settle Dialog */}
            <Portal>
                <AnimatePresence>
                    {settleDialog && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                                onClick={() => setSettleDialog(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[999999] bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-[500px] mx-auto"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                    <TrendingUp size={24} className="text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-black text-foreground mb-1">Piutang Lunas! 🎉</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <strong>{settleDialog.debt.debtorName}</strong> telah membayar{" "}
                                    <strong className="text-emerald-600">{formatCurrency(settleDialog.debt.amount)}</strong>
                                </p>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Apakah kamu ingin menambahkan dana ini ke saldo utama sebagai transaksi <em>pemasukan</em>?
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleSettle(true)}
                                        className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                                    >
                                        ✅ Ya, Tambah ke Saldo
                                    </button>
                                    <button
                                        onClick={() => handleSettle(false)}
                                        className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-foreground font-bold text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
                                    >
                                        Tandai Lunas Saja
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}
