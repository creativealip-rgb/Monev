"use client";

import { TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { TransactionType } from "../types";

interface TypeSectionProps {
    transactionType: TransactionType;
    onTypeChange: (type: TransactionType) => void;
}

export function TypeSection({ transactionType, onTypeChange }: TypeSectionProps) {
    return (
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
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
                onClick={() => onTypeChange("transfer")}
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all",
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
