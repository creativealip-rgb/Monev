"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Wallet, TrendingUp, Utensils, Car, Gamepad2, ShoppingBag, Heart, BookOpen, Receipt, TrendingUp as InvestIcon, Banknote, Briefcase, MoreHorizontal } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

import { Transaction } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";

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
    const [error, setError] = useState<string | null>(null);

    // Load transaction data when opened
    useEffect(() => {
        if (transaction && isOpen) {
            setAmount(transaction.amount.toString());
            setDescription(transaction.description);
            setSelectedCategory(transaction.categoryId || null);
            if (transaction.type === "expense" || transaction.type === "income") {
                loadCategories(transaction.type);
            } else {
                loadCategories("expense"); // Fallback for transfer
            }
            setStep("amount");
            setError(null);
        }
    }, [transaction, isOpen]);

    const loadCategories = async (type: "expense" | "income") => {
        try {
            const response = await apiFetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                setCategories(result.data.filter((c: Category) => c.type === type));
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    };

    const handleAmountSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError("Masukkan nominal yang valid");
            return;
        }
        setError(null);
        setStep("category");
    };

    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategory(categoryId);
        setStep("details");
    };

    const handleSubmit = async () => {
        if (!selectedCategory || !description || !transaction) {
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
                    description,
                    categoryId: selectedCategory,
                    type: transaction.type as "expense" | "income",
                    paymentMethod: "cash",
                    date: transaction.created_at,
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen || !transaction) return null;

    const transactionTypeLabel = transaction.type === "expense" ? "Pengeluaran" : "Pemasukan";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[10001] overflow-y-auto"
            >
                <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-sky-100/50 to-cyan-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-transparent dark:from-sky-900/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-200/30 via-transparent to-transparent dark:from-cyan-900/20" />
                </div>

                <div className="min-h-screen max-w-[500px] mx-auto bg-sky-50/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-sky-900/10 dark:shadow-slate-950/30">
                    <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
                        <button
                            onClick={step === "amount" ? handleClose : () => setStep(step === "category" ? "amount" : "category")}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
                        >
                            {step === "amount" ? <X size={20} /> : <ArrowLeft size={20} />}
                        </button>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Transaksi</h2>
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
                                transaction.type === "expense" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
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
                                    type="number"
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
                                    disabled={loading || !description}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-bold text-white transition-all",
                                        loading || !description ? "bg-slate-300 dark:bg-slate-700" : "bg-sky-500 hover:bg-sky-600"
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
