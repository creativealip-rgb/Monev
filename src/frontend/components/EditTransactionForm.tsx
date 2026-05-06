"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Wallet, TrendingUp, Utensils, Car, Gamepad2, ShoppingBag, Heart, BookOpen, Receipt, TrendingUp as InvestIcon, Banknote, Briefcase, MoreHorizontal } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

import { Transaction } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { createLogger } from "@/lib/logger";

const logger = createLogger("EditTransactionForm");


interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

interface EditTransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    transaction: Transaction | null;
}

const categoryIcons: Record<string, typeof Wallet> = {
    "Utensils": Utensils,
    "Car": Car,
    "Gamepad2": Gamepad2,
    "ShoppingBag": ShoppingBag,
    "Heart": Heart,
    "BookOpen": BookOpen,
    "Receipt": Receipt,
    "TrendingUp": InvestIcon,
    "Banknote": Banknote,
    "Briefcase": Briefcase,
    "MoreHorizontal": MoreHorizontal,
    "Wallet": Wallet,
};

export function EditTransactionForm({ isOpen, onClose, onSuccess, transaction }: EditTransactionFormProps) {
    const [step, setStep] = useState<"amount" | "category" | "details">("amount");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
    const { accounts, isLoading: accountsLoading } = useAccountsData();
    const [error, setError] = useState<string | null>(null);
    const haptics = useHaptics();


    // Load transaction data when opened
    useEffect(() => {
        if (transaction && isOpen) {
            setAmount(transaction.amount.toString());
            setDescription(transaction.description);
            setSelectedCategory(transaction.categoryId || null);
            loadCategories(transaction.type as any);
            setStep("amount");
            setSelectedAccountId((transaction as any).accountId || null);
            setTargetAccountId((transaction as any).targetAccountId || null);
            setError(null);

        }
    }, [transaction, isOpen]);

    const loadCategories = async (type: "expense" | "income" | "transfer") => {
        try {
            const response = await apiFetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                setCategories(result.data.filter((c: Category) => {
                    if (type === "transfer") return c.name === "Transfer";
                    return c.type === type;
                }));
            }
        } catch (err) {
            logger.error("Error loading categories", err);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [isOpen, loading, onClose]);

    const handleAmountSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError("Masukkan nominal yang valid");
            return;
        }
        setError(null);
        setStep(transaction?.type === "transfer" || categories.length === 0 ? "details" : "category");
    };

    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategory(categoryId);
        setStep("details");
    };

    const handleSubmit = async () => {
        if (loading) return;
        const isTransfer = transaction?.type === "transfer";

        if (!transaction || !description.trim() || (!isTransfer && categories.length > 0 && !selectedCategory) || !selectedAccountId || (isTransfer && !targetAccountId)) {
            setError("Lengkapi semua field");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch(`/api/transactions/${transaction.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description: description.trim(),
                    categoryId: isTransfer ? null : (selectedCategory ?? null),
                    type: transaction.type,
                    paymentMethod: "cash",
                    accountId: selectedAccountId,
                    targetAccountId: transaction.type === 'transfer' ? targetAccountId : null,
                    date: transaction.createdAt,
                }),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || "Gagal menyimpan transaksi");
            }
        } catch (err) {
            setError("Gagal menyimpan transaksi");
            logger.error("Error saving transaction", err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = useCallback(() => {
        if (loading) return;
        onClose();
    }, [loading, onClose]);

    if (!isOpen || !transaction) return null;

    const transactionTypeLabel = transaction.type === "expense" ? "Pengeluaran" : transaction.type === "income" ? "Pemasukan" : "Transfer";
    const typeColorClass = transaction.type === "expense" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" :
        transaction.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" :
            "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-transaction-title"
                className="fixed inset-0 z-[10001] overflow-x-hidden overflow-y-auto"
            >
                <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-sky-100/50 to-cyan-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-transparent dark:from-sky-900/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-200/30 via-transparent to-transparent dark:from-cyan-900/20" />
                </div>

                <div className="min-h-screen max-w-[500px] mx-auto bg-sky-50/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-sky-900/10 dark:shadow-slate-950/30">
                    <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
                        <button
                            onClick={step === "amount" ? handleClose : () => setStep(step === "category" ? "amount" : "category")}
                            aria-label={step === "amount" ? "Tutup edit transaksi" : "Kembali ke langkah sebelumnya"}
                            disabled={loading && step === "amount"}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
                        >
                            {step === "amount" ? <X size={20} /> : <ArrowLeft size={20} />}
                        </button>
                        <h2 id="edit-transaction-title" className="text-lg font-bold text-slate-900 dark:text-white">Edit Transaksi</h2>
                        <div className="w-10" />
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="mb-6 text-center">
                            <span className={cn(
                                "inline-block px-3 py-1 rounded-full text-xs font-bold",
                                typeColorClass
                            )}>
                                {transactionTypeLabel}
                            </span>
                        </div>

                        {step === "amount" && (
                            <div className="space-y-6">
                                <div className="text-center py-8">
                                    <p className="text-slate-400 dark:text-slate-500 text-sm mb-2">Nominal</p>
                                    <div className="text-5xl font-bold text-slate-900 dark:text-white">
                                        {amount ? formatCurrency(parseFloat(amount)) : "Rp 0"}
                                    </div>
                                </div>
                                <input
                                    id="edit-transaction-amount"
                                    aria-label="Nominal transaksi"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full text-center text-3xl font-bold p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAmountSubmit}
                                    disabled={!amount}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-bold text-white transition-all",
                                        amount ? "bg-sky-500 hover:bg-sky-600" : "bg-slate-300 dark:bg-slate-700"
                                    )}
                                >
                                    Lanjut
                                </button>
                            </div>
                        )}

                        {step === "category" && (
                            <div className="space-y-4">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">Pilih kategori</p>
                                {categories.length === 0 && (
                                    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                                        Kategori belum tersedia untuk tipe transaksi ini.
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map((cat) => {
                                        const Icon = categoryIcons[cat.icon] || Wallet;
                                        const isSelected = selectedCategory === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all text-left",
                                                    isSelected
                                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30"
                                                        : "border-transparent bg-slate-50 dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-600"
                                                )}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center"
                                                    style={{ backgroundColor: cat.color + "20" }}
                                                >
                                                    <Icon size={20} style={{ color: cat.color }} />
                                                </div>
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{cat.name}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === "details" && (
                            <div className="space-y-6">
                                {/* Account Selection */}
                                <div className="space-y-4">
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        {transaction.type === 'transfer' ? 'Dari Saldo' : 'Sumber Saldo'}
                                    </p>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {accounts.map((acc) => {
                                            const isSelected = selectedAccountId === acc.id;
                                            return (
                                                <button
                                                    key={acc.id}
                                                    onClick={() => { haptics.tap(); setSelectedAccountId(acc.id); }}
                                                    className={cn(
                                                        "min-w-[120px] p-3 rounded-2xl border-2 transition-all text-left",
                                                        isSelected
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/40"
                                                            : "bg-slate-50 dark:bg-slate-800 border-transparent"
                                                    )}
                                                >
                                                    <p className="font-bold text-slate-900 dark:text-white text-[10px] truncate">{acc.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Rp {acc.balance.toLocaleString('id-ID')}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {transaction.type === 'transfer' && (
                                    <div className="space-y-4">
                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Ke Saldo</p>
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                            {accounts.filter(a => a.id !== selectedAccountId).map((acc) => {
                                                const isSelected = targetAccountId === acc.id;
                                                return (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => { haptics.tap(); setTargetAccountId(acc.id); }}
                                                        className={cn(
                                                            "min-w-[120px] p-3 rounded-2xl border-2 transition-all text-left",
                                                            isSelected
                                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40"
                                                                : "bg-slate-50 dark:bg-slate-800 border-transparent"
                                                        )}
                                                    >
                                                        <p className="font-bold text-slate-900 dark:text-white text-[10px] truncate">{acc.name}</p>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Rp {acc.balance.toLocaleString('id-ID')}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Deskripsi
                                    </label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Contoh: Makan siang di warteg"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-sky-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Nominal</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(parseFloat(amount))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Kategori</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{categories.find(c => c.id === selectedCategory)?.name}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !description || (transaction.type === 'transfer' && !targetAccountId)}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-bold text-white transition-all",
                                        loading || !description || (transaction.type === 'transfer' && !targetAccountId)
                                            ? "bg-slate-300 dark:bg-slate-700"
                                            : transaction.type === "expense"
                                                ? "bg-rose-500 hover:bg-rose-600"
                                                : transaction.type === "income"
                                                    ? "bg-emerald-500 hover:bg-emerald-600"
                                                    : "bg-sky-500 hover:bg-sky-600"
                                    )}
                                >
                                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
