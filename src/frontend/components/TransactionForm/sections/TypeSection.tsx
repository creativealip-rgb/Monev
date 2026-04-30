"use client";

import { TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { TransactionType } from "../types";

interface TypeSectionProps {
    transactionType: TransactionType;
    onTypeChange: (type: TransactionType) => void;
    transferDisabled?: boolean;
}

export function TypeSection({ transactionType, onTypeChange, transferDisabled = false }: TypeSectionProps) {
    return (
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
                type="button"
                onClick={() => onTypeChange("expense")}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                    transactionType === "expense"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
            >
                <TrendingUp size={18} />
                Pengeluaran
            </button>
            <button
                type="button"
                onClick={() => onTypeChange("income")}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                    transactionType === "income"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
            >
                <Wallet size={18} />
                Pemasukan
            </button>
            <button
                type="button"
                onClick={() => {
                    if (!transferDisabled) onTypeChange("transfer");
                }}
                disabled={transferDisabled}
                aria-disabled={transferDisabled}
                title={transferDisabled ? "Minimal 2 akun saldo untuk transfer" : undefined}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
                    transferDisabled && "cursor-not-allowed opacity-50",
                    transactionType === "transfer"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
            >
                <TrendingUp className="rotate-90" size={18} />
                Transfer
            </button>
        </div>
    );
}
