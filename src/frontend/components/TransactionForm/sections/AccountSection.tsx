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
    onAddAccount?: () => void;
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
    onAddAccount,
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
                                type="button"
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
                        <div className="w-full rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 p-4 text-center dark:border-sky-900 dark:bg-sky-900/20">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Belum ada akun saldo.</p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Tambahkan akun dulu supaya transaksi bisa disimpan.</p>
                            {onAddAccount && (
                                <button
                                    type="button"
                                    onClick={onAddAccount}
                                    className="mt-3 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/20"
                                >
                                    + Tambah Akun Saldo
                                </button>
                            )}
                        </div>
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
                                    type="button"
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
                        {accounts.filter(a => a.id !== selectedAccountId).length === 0 && (
                            <div className="w-full rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-center dark:border-amber-900 dark:bg-amber-900/20">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Belum ada akun tujuan.</p>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Transfer butuh minimal 2 akun saldo yang berbeda.</p>
                                {onAddAccount && (
                                    <button
                                        type="button"
                                        onClick={onAddAccount}
                                        className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/20"
                                    >
                                        + Tambah Akun Tujuan
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
