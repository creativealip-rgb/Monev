"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Coffee, ShoppingBag, Zap, CreditCard, ArrowRight, TrendingUp, Gamepad2, Heart, BookOpen, Receipt, Car, Utensils, Briefcase, Square, CheckSquare, Trash2, Edit2, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { TransactionWithCategory } from "@/types";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { normalizeDateValue } from "@/frontend/lib/normalize-date";
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useSecurity } from "@/components/SecurityProvider";
import { decryptData } from "@/lib/encryption";

const SWIPE_ACTION_WIDTH = 88;
const SWIPE_TRIGGER_OFFSET = 72;
const OPENING_BALANCE_PREFIX = "[OPENING_BALANCE]";
const BALANCE_ADJUSTMENT_PREFIX = "[BALANCE_ADJUSTMENT]";

function getBalanceAuditInfo(description?: string | null) {
    if (description?.startsWith(OPENING_BALANCE_PREFIX)) {
        return {
            label: "Saldo Awal",
            category: "Penyesuaian Saldo",
            displayDescription: description.replace(OPENING_BALANCE_PREFIX, "").trim() || "Saldo awal akun",
        };
    }

    if (description?.startsWith(BALANCE_ADJUSTMENT_PREFIX)) {
        return {
            label: "Penyesuaian",
            category: "Penyesuaian Saldo",
            displayDescription: description.replace(BALANCE_ADJUSTMENT_PREFIX, "").trim() || "Penyesuaian saldo akun",
        };
    }

    return null;
}

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; color: string; gradient: string }> = {
    "Makan & Minuman": {
        icon: Utensils,
        color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        gradient: "from-orange-500 to-amber-500"
    },
    "Transportasi": {
        icon: Car,
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        gradient: "from-blue-500 to-indigo-500"
    },
    "Hiburan": {
        icon: Gamepad2,
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        gradient: "from-purple-500 to-pink-500"
    },
    "Belanja": {
        icon: ShoppingBag,
        color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
        gradient: "from-pink-500 to-rose-500"
    },
    "Kesehatan": {
        icon: Heart,
        color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        gradient: "from-green-500 to-emerald-500"
    },
    "Pendidikan": {
        icon: BookOpen,
        color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
        gradient: "from-teal-500 to-cyan-500"
    },
    "Tagihan": {
        icon: Receipt,
        color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        gradient: "from-red-500 to-rose-500"
    },
    "Investasi": {
        icon: TrendingUp,
        color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        gradient: "from-emerald-500 to-teal-500"
    },
    "Gaji": {
        icon: Briefcase,
        color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        gradient: "from-emerald-500 to-green-500"
    },
    "Freelance": {
        icon: Briefcase,
        color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
        gradient: "from-violet-500 to-purple-500"
    },
    "Lainnya": {
        icon: CreditCard,
        color: "bg-muted text-muted-foreground",
        gradient: "from-slate-500 to-slate-400"
    },
    Food: {
        icon: Coffee,
        color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        gradient: "from-orange-500 to-amber-500"
    },
    Shopping: {
        icon: ShoppingBag,
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        gradient: "from-blue-500 to-indigo-500"
    },
    Utilities: {
        icon: Zap,
        color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
        gradient: "from-yellow-500 to-orange-500"
    },
    Transport: {
        icon: ArrowRight,
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        gradient: "from-purple-500 to-pink-500"
    },
    Income: {
        icon: TrendingUp,
        color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        gradient: "from-emerald-500 to-teal-500"
    },
    Default: {
        icon: CreditCard,
        color: "bg-muted text-muted-foreground",
        gradient: "from-slate-500 to-slate-400"
    },
};

interface TransactionItemProps {
    transaction: TransactionWithCategory;
    onClick?: () => void;
    onEdit?: (transaction: TransactionWithCategory) => void;
    onDelete?: (id: number) => void;
    showCheckbox?: boolean;
    isSelected?: boolean;
    onSelect?: (id: number) => void;
    hideAmount?: boolean;
}

export const TransactionItem = React.memo(function TransactionItem({ transaction, onClick, onEdit, onDelete, showCheckbox, isSelected, onSelect, hideAmount = false }: TransactionItemProps) {
    const { encryptionKey } = useSecurity();
    const [displayDescription, setDisplayDescription] = useState(transaction.description || "Tanpa Deskripsi");
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const decrypt = async () => {
            if (transaction.description?.startsWith("enc:")) {
                if (encryptionKey) {
                    try {
                        const encryptedPart = transaction.description.replace("enc:", "");
                        const decrypted = await decryptData(encryptedPart, encryptionKey);
                        setDisplayDescription(decrypted);
                    } catch {
                        setDisplayDescription("🔒 [Encrypted]");
                    }
                } else {
                    setDisplayDescription("🔒 [Locked]");
                }
            } else {
                setDisplayDescription(transaction.description || "Tanpa Deskripsi");
            }
        };

        decrypt();
    }, [transaction.description, encryptionKey]);

    const balanceAudit = getBalanceAuditInfo(displayDescription);
    const style = balanceAudit
        ? {
            icon: SlidersHorizontal,
            color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            gradient: "from-amber-500 to-orange-400",
        }
        : CATEGORY_STYLES[transaction.categoryName] || CATEGORY_STYLES.Default;
    const isExpense = transaction.type === "expense";
    const isIncome = transaction.type === "income";
    const Icon = style.icon;
    const displayAmount = hideAmount ? "••••••" : formatCurrency(transaction.amount);
    const visibleDescription = balanceAudit?.displayDescription || displayDescription;
    const visibleCategory = balanceAudit?.category || transaction.categoryName || "Lainnya";
    const transactionLabel = `${visibleDescription}, ${visibleCategory}, ${hideAmount ? "nominal disembunyikan" : formatCurrency(transaction.amount)}`;

    // Swipe mechanism
    const x = useMotionValue(0);
    const leftActionOpacity = useTransform(x, [0, SWIPE_ACTION_WIDTH], [0, 1]);
    const rightActionOpacity = useTransform(x, [-SWIPE_ACTION_WIDTH, 0], [1, 0]);

    return (
        <div className="relative mb-2 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 flex items-stretch">
                <motion.button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ opacity: leftActionOpacity }}
                    onClick={(event) => {
                        event.stopPropagation();
                        onEdit?.(transaction);
                    }}
                    className="flex w-[88px] flex-col items-center justify-center gap-1 rounded-l-2xl bg-sky-500 text-white"
                >
                    <Edit2 size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                </motion.button>
                <div className="flex-1 bg-transparent" />
                <motion.button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{ opacity: rightActionOpacity }}
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(transaction.id);
                    }}
                    className="flex w-[88px] flex-col items-center justify-center gap-1 rounded-r-2xl bg-rose-500 text-white"
                >
                    <Trash2 size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hapus</span>
                </motion.button>
            </div>

            {/* Swipeable Content */}
            <motion.div
                style={{ x }}
                drag="x"
                dragConstraints={{ left: -SWIPE_ACTION_WIDTH, right: SWIPE_ACTION_WIDTH }}
                dragElastic={0.08}
                dragMomentum={false}
                onDragStart={() => {
                    isDraggingRef.current = true;
                }}
                onDragEnd={(_, info) => {
                    if (info.offset.x <= -SWIPE_TRIGGER_OFFSET) {
                        onDelete?.(transaction.id);
                    } else if (info.offset.x >= SWIPE_TRIGGER_OFFSET) {
                        onEdit?.(transaction);
                    }
                    x.stop();
                    x.set(0);
                    window.setTimeout(() => {
                        isDraggingRef.current = false;
                    }, 0);
                }}
                onClick={() => {
                    if (!isDraggingRef.current) {
                        onClick?.();
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onClick?.();
                    }
                    if (event.key.toLowerCase() === "e") {
                        event.preventDefault();
                        onEdit?.(transaction);
                    }
                    if (event.key === "Delete" || event.key === "Backspace") {
                        event.preventDefault();
                        onDelete?.(transaction.id);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${transactionLabel}. Tekan Enter untuk detail, E untuk edit, Delete untuk hapus.`}
                className={cn(
                    "relative z-10 flex w-full items-center cursor-pointer p-4 card-clean",
                    "transition-shadow duration-300"
                )}
            >
                {showCheckbox && (
                    <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${isSelected ? "Batalkan pilihan" : "Pilih"} transaksi ${visibleDescription}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(transaction.id);
                        }}
                        className="mr-3 flex-shrink-0"
                    >
                        {isSelected ? (
                            <CheckSquare size={22} className="text-sky-500" />
                        ) : (
                            <Square size={22} className="text-slate-300 dark:text-slate-600" />
                        )}
                    </button>
                )}
                <div className={cn(
                    "relative w-12 h-12 rounded-2xl flex items-center justify-center mr-4 overflow-hidden flex-shrink-0",
                    style.color
                )}>
                    <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br",
                        style.gradient
                    )} />
                    <Icon size={22} strokeWidth={2} className="relative z-10" />
                </div>

                <div className="flex-1 min-w-0 overflow-hidden mr-4">
                    <h4 className="font-bold text-foreground text-[13px] leading-tight line-clamp-1 break-all">
                        {visibleDescription}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "text-[11px] font-medium truncate",
                            balanceAudit ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
                        )}>
                            {visibleCategory}
                        </span>
                        {balanceAudit && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                {balanceAudit.label}
                            </span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">
                            {(() => {
                                try {
                                    // Use transaction.date (actual transaction date) instead of createdAt
                                    const date = normalizeDateValue(transaction.date);
                                    return isNaN(date.getTime()) ? "N/A" : format(date, "dd MMM, HH:mm", { locale: id });
                                } catch {
                                    return "N/A";
                                }
                            })()}
                        </span>
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <p className={cn(
                        "font-bold text-[13px] tracking-tight whitespace-nowrap tabular-nums",
                        balanceAudit ? "text-amber-600 dark:text-amber-300" : isIncome ? "text-emerald-500" : isExpense ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {balanceAudit ? (isIncome ? "+" : isExpense ? "−" : "") : isIncome ? "+" : isExpense ? "−" : ""} {displayAmount}
                    </p>
                    {transaction.isVerified && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-medium text-muted-foreground">Verified</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
});
