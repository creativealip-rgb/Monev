"use client";

import { FormEvent, useEffect, useState } from "react";
import { Coffee, Plus, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/frontend/lib/utils";
import { Portal } from "@/frontend/components/Portal";
import { TransactionDetailModal } from "@/frontend/components/modals/TransactionDetailModal";
import type { TransactionWithCategory } from "@/types";

type Shortcut = {
    id: number;
    label: string;
    amount: number;
    type: "expense" | "income";
    icon: string;
    color: string;
    usageCount: number;
};

type Category = { id: number; name: string; type: "expense" | "income" };
type Account = { id: number; name: string; type?: string };
type Suggestion = {
    label: string;
    amount: number;
    type: "expense" | "income";
    categoryId: number;
    accountId: number;
    categoryName?: string;
    accountName?: string;
    count: number;
    merchantName?: string;
    confidence: number;
};

type QuickAddShortcutsWidgetProps = {
    onSuccess: () => void;
};

const defaultForm = {
    label: "Makan Siang",
    amount: "25000",
    type: "expense" as "expense" | "income",
    categoryId: "",
    accountId: "",
    merchantName: "",
};

export function QuickAddShortcutsWidget({ onSuccess }: QuickAddShortcutsWidgetProps) {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [runningId, setRunningId] = useState<number | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);

    const loadShortcuts = async () => {
        const response = await fetch("/api/quick-add");
        const json = await response.json();
        if (json.success) setShortcuts((json.data || []).slice(0, 6));
    };

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const [shortcutsResponse, suggestionsResponse, categoriesResponse, accountsResponse] = await Promise.all([
                fetch("/api/quick-add"),
                fetch("/api/quick-add?suggestions=true"),
                fetch("/api/categories"),
                fetch("/api/accounts"),
            ]);
            const [shortcutsJson, suggestionsJson, categoriesJson, accountsJson] = await Promise.all([
                shortcutsResponse.json(),
                suggestionsResponse.json(),
                categoriesResponse.json(),
                accountsResponse.json(),
            ]);

            if (cancelled) return;
            if (shortcutsJson.success) setShortcuts((shortcutsJson.data || []).slice(0, 6));
            if (suggestionsJson.success) setSuggestions((suggestionsJson.data || []).slice(0, 3));
            if (categoriesJson.success) {
                const list = categoriesJson.data || [];
                setCategories(list);
                const firstExpense = list.find((category: Category) => category.type === "expense");
                if (firstExpense) setForm((current) => ({ ...current, categoryId: String(firstExpense.id) }));
            }
            if (accountsJson.success) {
                const list = accountsJson.data || [];
                setAccounts(list);
                if (list[0]) setForm((current) => ({ ...current, accountId: String(list[0].id) }));
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const showTransactionDetail = (shortcut: Shortcut, transaction: TransactionWithCategory) => {
        const category = categories.find((item) => item.id === transaction.categoryId);
        setSelectedTransaction({
            ...transaction,
            categoryName: transaction.categoryName || category?.name || shortcut.label,
            categoryColor: transaction.categoryColor || shortcut.color || "#0ea5e9",
            categoryIcon: transaction.categoryIcon || shortcut.icon || "⚡",
        });
    };

    const runShortcut = async (shortcut: Shortcut) => {
        setRunningId(shortcut.id);
        try {
            const response = await fetch(`/api/quick-add/${shortcut.id}/run`, { method: "POST" });
            const json = await response.json();
            if (json.success) {
                if (json.data) showTransactionDetail(shortcut, json.data as TransactionWithCategory);
                setShortcuts((current) => current.map((item) => item.id === shortcut.id ? { ...item, usageCount: item.usageCount + 1 } : item));
            }
        } finally {
            setRunningId(null);
        }
    };

    const createShortcut = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await fetch("/api/quick-add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    amount: Number(form.amount),
                    categoryId: Number(form.categoryId),
                    accountId: Number(form.accountId),
                    merchantName: form.merchantName || form.label,
                }),
            });
            const json = await response.json();
            if (json.success) {
                setShowCreate(false);
                setForm(defaultForm);
                await loadShortcuts();
            }
        } finally {
            setSaving(false);
        }
    };

    const acceptSuggestion = async (suggestion: Suggestion) => {
        const response = await fetch("/api/quick-add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                label: suggestion.label,
                amount: suggestion.amount,
                type: suggestion.type,
                categoryId: suggestion.categoryId,
                accountId: suggestion.accountId,
                merchantName: suggestion.merchantName || suggestion.label,
            }),
        });
        const json = await response.json();
        if (json.success) {
            setSuggestions((current) => current.filter((item) => item.label !== suggestion.label));
            await loadShortcuts();
        }
    };

    const filteredCategories = categories.filter((category) => category.type === form.type);
    const missingSetupMessage = !accounts.length
        ? "Tambahkan akun dulu supaya shortcut tahu uangnya keluar/masuk dari mana."
        : !filteredCategories.length
            ? `Tambahkan kategori ${form.type === "expense" ? "pengeluaran" : "pemasukan"} dulu supaya shortcut bisa disimpan.`
            : "";
    const canSaveShortcut = Boolean(form.categoryId && form.accountId && !missingSetupMessage);

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="px-4 mb-4 sm:px-6 sm:mb-6"
        >
            <div className="rounded-[28px] border border-sky-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">Quick Add</p>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Transaksi sekali tap</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300"
                        aria-label="Buat shortcut transaksi"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {shortcuts.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/70 p-4 text-left transition hover:bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm dark:bg-slate-900">
                            <Coffee className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Belum ada shortcut</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Buat template seperti Makan Siang, Parkir, atau Bensin.</p>
                        </div>
                    </button>
                ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {shortcuts.map((shortcut) => (
                            <button
                                key={shortcut.id}
                                type="button"
                                onClick={() => runShortcut(shortcut)}
                                disabled={runningId === shortcut.id}
                                className="min-w-[132px] rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ backgroundColor: shortcut.color || "#0ea5e9" }}>
                                        <Zap className="h-4 w-4" />
                                    </span>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{shortcut.type}</span>
                                </div>
                                <p className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">{shortcut.label}</p>
                                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{formatCurrency(shortcut.amount)}</p>
                            </button>
                        ))}
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/30">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">Saran otomatis</p>
                        <div className="space-y-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={`${suggestion.label}-${suggestion.categoryId}-${suggestion.accountId}`}
                                    type="button"
                                    onClick={() => acceptSuggestion(suggestion)}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{suggestion.label}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {suggestion.count}x dipakai - {suggestion.categoryName || "Kategori"} - {suggestion.accountName || "Akun"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-sky-700 dark:text-sky-300">{formatCurrency(suggestion.amount)}</p>
                                        <p className="text-[10px] font-bold text-slate-400">+ Tambah</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreate && (
                <Portal>
                    <div className="fixed inset-0 z-[2147483646] bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80" onClick={() => setShowCreate(false)} />
                    <div
                        className="fixed z-[2147483647] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-[2rem] shadow-2xl sm:rounded-[2.5rem]"
                        style={{
                            left: "50%",
                            top: "50%",
                            maxHeight: "calc(100vh - 2rem)",
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <form onSubmit={createShortcut} className="w-full border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">Shortcut Baru</p>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Buat Quick Add</h3>
                                </div>
                                <button type="button" onClick={() => setShowCreate(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Nama shortcut" required />
                                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Nominal" inputMode="numeric" required />
                                <div className="grid grid-cols-2 gap-2">
                                    <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "expense" | "income", categoryId: "" })}>
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                    <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                                        {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                                    </select>
                                </div>
                                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                                    <option value="">Pilih kategori</option>
                                    {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </select>
                                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950" value={form.merchantName} onChange={(e) => setForm({ ...form, merchantName: e.target.value })} placeholder="Merchant optional" />
                                {missingSetupMessage && (
                                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                                        {missingSetupMessage}
                                    </p>
                                )}
                            </div>

                            <button type="submit" disabled={saving || !canSaveShortcut} className="mt-4 w-full rounded-2xl bg-orange-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">
                                {saving ? "Menyimpan..." : "Simpan Shortcut"}
                            </button>
                        </form>
                    </div>
                </Portal>
            )}

            <TransactionDetailModal
                isOpen={selectedTransaction !== null}
                onClose={() => {
                    setSelectedTransaction(null);
                    onSuccess();
                }}
                transaction={selectedTransaction}
                accounts={accounts.map((account) => ({ id: account.id, name: account.name, type: account.type || "cash" }))}
                onEdit={() => setSelectedTransaction(null)}
                onDelete={() => setSelectedTransaction(null)}
            />
        </motion.section>
    );
}
