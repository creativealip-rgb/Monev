"use client";

import {
    TrendingDown, TrendingUp, Check, Trash2, Calendar, X, Banknote, Pencil
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Debt } from "../types";
import { getDebtAmounts, stripOrigTag } from "../utils";

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
};

export function DebtCard({
    debt,
    onMarkPaid,
    onDelete,
    onPartialPayment,
    onEdit,
}: {
    debt: Debt;
    onMarkPaid: (id: number, status: "unpaid" | "paid", debt?: Debt) => void;
    onDelete: (id: number) => void;
    onPartialPayment: (debt: Debt) => void;
    onEdit?: (debt: Debt) => void;
}) {
    const isOwe = debt.direction === "owe";
    const isPaid = debt.status === "paid";
    const hasDueDate = !!debt.dueDate;
    const isOverdue = hasDueDate && !isPaid && new Date(debt.dueDate!) < new Date();
    const { originalAmount, remainingAmount, paidAmount, hasPartialPayment } = getDebtAmounts(debt);
    const progressPercent = hasPartialPayment ? Math.round((paidAmount / originalAmount) * 100) : 0;
    const displayDescription = stripOrigTag(debt.description);
    const cardLabel = `${debt.debtorName}, ${isOwe ? "hutang" : "piutang"}, ${formatCurrency(debt.amount)}`;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, a, input, select, textarea")) return;
        if (event.key === "Enter" && !isPaid) {
            event.preventDefault();
            onPartialPayment(debt);
        }
        if ((event.key === "e" || event.key === "E") && onEdit) {
            event.preventDefault();
            onEdit(debt);
        }
        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            onDelete(debt.id);
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            layout
            role="article"
            tabIndex={0}
            aria-label={`${cardLabel}. Tekan Enter untuk bayar sebagian, E untuk edit, Delete untuk hapus.`}
            onKeyDown={handleKeyDown}
            className={cn(
                "card-clean p-4 border-l-4 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                isPaid ? "border-l-emerald-400 opacity-60" : isOwe ? "border-l-rose-400" : "border-l-sky-400"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                        isPaid ? "bg-emerald-50 dark:bg-emerald-900/30" : isOwe ? "bg-rose-50 dark:bg-rose-900/30" : "bg-sky-50 dark:bg-sky-900/30"
                    )}>
                        {isOwe
                            ? <TrendingDown size={18} className="text-rose-500" />
                            : <TrendingUp size={18} className="text-sky-500" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{debt.debtorName}</p>
                        {displayDescription && <p className="text-xs text-muted-foreground truncate mt-0.5">{displayDescription}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {hasPartialPayment && !isPaid ? (
                                <span className={cn("text-xs font-bold", isOwe ? "text-rose-600" : "text-sky-600")}>
                                    {formatCurrency(remainingAmount)}
                                    <span className="text-muted-foreground font-medium"> / {formatCurrency(originalAmount)}</span>
                                </span>
                            ) : (
                                <span className={cn("text-xs font-bold", isPaid ? "text-emerald-600" : isOwe ? "text-rose-600" : "text-sky-600")}>
                                    {formatCurrency(debt.amount)}
                                </span>
                            )}
                            {hasDueDate && (
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1",
                                    isOverdue ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                                )}>
                                    <Calendar size={9} />
                                    {format(new Date(debt.dueDate!), "d MMM yy", { locale: id })}
                                </span>
                            )}
                            {isPaid && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">
                                    Lunas
                                </span>
                            )}
                        </div>

                        {hasPartialPayment && !isPaid && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-muted-foreground font-medium">Terbayar {progressPercent}%</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">{formatCurrency(paidAmount)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className={cn("h-full rounded-full", isOwe ? "bg-rose-400" : "bg-sky-400")}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {!isPaid && (
                        <button
                            type="button"
                            onClick={() => onPartialPayment(debt)}
                            aria-label="Bayar sebagian hutang atau piutang"
                            title="Bayar Sebagian"
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        >
                            <Banknote size={16} className="text-amber-600" />
                        </button>
                    )}
                    {!isPaid && (
                        <button
                            type="button"
                            onClick={() => onMarkPaid(debt.id, "paid", debt)}
                            aria-label="Tandai lunas"
                            title="Tandai Lunas"
                            className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors"
                        >
                            <Check size={16} className="text-emerald-600" />
                        </button>
                    )}
                    {isPaid && (
                        <button
                            type="button"
                            onClick={() => onMarkPaid(debt.id, "unpaid")}
                            aria-label="Tandai belum lunas"
                            title="Tandai Belum Lunas"
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                            <X size={14} className="text-slate-500" />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(debt)}
                            aria-label="Edit hutang atau piutang"
                            title="Edit"
                            className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 flex items-center justify-center transition-colors"
                        >
                            <Pencil size={14} className="text-sky-500" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDelete(debt.id)}
                        aria-label="Hapus hutang atau piutang"
                        title="Hapus"
                        className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                    >
                        <Trash2 size={14} className="text-red-500" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
