"use client";

import { useState, useEffect } from "react";
import { Receipt, Check, Zap, Wifi, Tv, Music, Heart, Bike, Clock, AlertTriangle, Trash2, History } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { Bill } from "@/types";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    Receipt, Zap, Wifi, Tv, Music, Heart, Bike, Clock, AlertTriangle,
};

function BillIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
    const Icon = iconMap[name] || Receipt;
    return <Icon size={size} color={color} />;
}

export function getStatusInfo(bill: Bill, t: (key: string) => string) {
    const today = new Date().getDate();
    const daysUntilDue = bill.dueDate - today;

    if (bill.isPaid) {
        return { label: t("bills.paid"), color: "emerald", badge: "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
    }
    if (daysUntilDue < 0) {
        return { label: t("bills.overdue"), color: "rose", badge: "bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800" };
    }
    if (daysUntilDue <= 3) {
        return { label: `${daysUntilDue} ${t("bills.daysLeft")}`, color: "amber", badge: "bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
    }
    return { label: `${t("bills.dueDateLabel")} ${bill.dueDate}`, color: "slate", badge: "bg-slate-50 dark:bg-slate-800 text-muted-foreground border-slate-200 dark:border-slate-700" };
}

export interface BillItemProps {
    bill: Bill;
    index: number;
    onDelete: (id: number) => void;
    onToggle: (id: number, e: React.MouseEvent) => void;
    onShowHistory: (bill: Bill) => void;
    isStealthMode: boolean;
    t: (key: string) => string;
    showReminder?: boolean;
}

export function BillItem({
    bill,
    index,
    onDelete,
    onToggle,
    onShowHistory,
    isStealthMode,
    t,
    showReminder = false,
}: BillItemProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const status = getStatusInfo(bill, t);
    const today = new Date().getDate();
    const daysLeft = bill.dueDate - today;
    const isOverdue = daysLeft < 0 && !bill.isPaid;

    return (
        <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                "card-clean p-5 group relative cursor-pointer transition-all",
                bill.isPaid
                    ? "bg-emerald-50/30 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50"
                    : "hover:shadow-lg hover:shadow-sky-200/40 dark:hover:shadow-sky-900/20"
            )}
        >
            <div className="flex items-center gap-3 mb-3">
                <button
                    onClick={(e) => onToggle(bill.id, e)}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all",
                        bill.isPaid
                            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                    )}
                    style={!bill.isPaid ? { backgroundColor: bill.color + "20" } : {}}
                >
                    {bill.isPaid ? (
                        <Check size={20} strokeWidth={3} />
                    ) : (
                        <BillIcon name={bill.icon} color={bill.color} size={18} />
                    )}
                </button>
                <div className="flex-1">
                    <span className={cn(
                        "font-bold text-foreground text-[13px] block transition-all",
                        bill.isPaid ? "text-muted-foreground line-through" : ""
                    )}>
                        {bill.name}
                    </span>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {bill.frequency === "monthly" ? t("bills.frequency.monthly") : bill.frequency === "weekly" ? t("bills.frequency.weekly") : t("bills.frequency.yearly")}
                    </p>
                </div>
                <div className="text-right pr-2">
                    <span className={cn(
                        "font-bold text-[13px] block tabular-nums",
                        bill.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}>
                        {isStealthMode ? "******" : formatCurrency(bill.amount)}
                    </span>
                    <span className={cn(
                        "text-[10px] tabular-nums",
                        isOverdue ? "text-rose-500 font-semibold" : "text-muted-foreground"
                    )}>
                        {!mounted ? "..." : status.label}
                    </span>
                </div>
            </div>

            {/* Reminder badge */}
            {showReminder && !bill.isPaid && (
                <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold mb-2 w-fit",
                    isOverdue
                        ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                )}>
                    <Clock size={10} />
                    {isOverdue
                        ? "Sudah lewat jatuh tempo!"
                        : daysLeft === 0
                            ? "Jatuh tempo hari ini!"
                            : `Jatuh tempo dalam ${daysLeft} hari`
                    }
                </div>
            )}

            {/* Days remaining bar */}
            {!bill.isPaid && (
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={cn(
                            "h-full rounded-full",
                            isOverdue ? "bg-rose-500" : daysLeft <= 3 ? "bg-amber-500" : "bg-sky-500"
                        )}
                    />
                </div>
            )}

            {bill.isPaid && (
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <Check size={12} /> {t("bills.paid")}
                </p>
            )}

            {/* Actions - positioned absolute top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowHistory(bill);
                    }}
                    className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 flex items-center justify-center transition-colors"
                    title={t("bills.history")}
                >
                    <History size={14} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bill.id);
                    }}
                    className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-colors"
                    title={t("bills.deleteBill")}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </motion.div>
    );
}
