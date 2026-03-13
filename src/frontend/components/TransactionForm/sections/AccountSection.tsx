"use client";

import { cn } from "@/frontend/lib/utils";

interface Account {
    id: number;
    name: string;
    balance: number;
}

interface AccountSectionProps {
    accounts: Account[];
    accountsLoading: boolean;
    selectedAccountId: number | null;
    targetAccountId?: number | null;
    transactionType?: "expense" | "income" | "transfer";
    onSelectAccount: (accountId: number) => void;
    onSelectTargetAccount?: (accountId: number) => void;
    showTarget?: boolean;
}

export function AccountSection({
    accounts,
    accountsLoading,
    selectedAccountId,
    targetAccountId,
    transactionType,
    onSelectAccount,
    onSelectTargetAccount,
    showTarget = false,
}: AccountSectionProps) {
    if (accountsLoading) {
        return (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3].map(i => (
                    <div key={i} className="min-w-[120px] h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Source Account */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                        {transactionType === "transfer" ? "Dari Saldo" : "Sumber Saldo"}
                    </p>
                    {selectedAccountId && (
                        <span className="text-[10px] font-bold text-sky-500 uppercase">Terpilih</span>
                    )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {accounts.map((acc) => {
                        const isSelected = selectedAccountId === acc.id;
                        return (
                            <button
                                key={acc.id}
                                onClick={() => onSelectAccount(acc.id)}
                                className={cn(
                                    "min-w-[140px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                    isSelected
                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                                        : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                )}
                            >
                                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{acc.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Rp {acc.balance.toLocaleString("id-ID")}</p>
                            </button>
                        );
                    })}
                    {accounts.length === 0 && (
                        <div className="text-xs text-slate-400 italic py-2">Belum ada akun saldo.</div>
                    )}
                </div>
            </div>

            {/* Target Account (for transfer) */}
            {showTarget && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Ke Saldo</p>
                        {targetAccountId && (
                            <span className="text-[10px] font-bold text-sky-500 uppercase">Terpilih</span>
                        )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {accounts.filter(a => a.id !== selectedAccountId).map((acc) => {
                            const isSelected = targetAccountId === acc.id;
                            return (
                                <button
                                    key={acc.id}
                                    onClick={() => onSelectTargetAccount?.(acc.id)}
                                    className={cn(
                                        "min-w-[140px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                        isSelected
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                            : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    )}
                                >
                                    <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{acc.name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Rp {acc.balance.toLocaleString("id-ID")}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
