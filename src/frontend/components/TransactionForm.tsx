"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Wallet, TrendingUp, Utensils, Car, Gamepad2, ShoppingBag, Heart, BookOpen, Receipt, TrendingUp as InvestIcon, Banknote, Briefcase, MoreHorizontal } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { useToast } from "./UI";
import { predictCategory } from "@/lib/context-engine";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { SplitBillFlow } from "./SplitBillFlow";

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
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
};

import { useHaptics } from "@/frontend/hooks/useHaptics";
import { CacheManager } from "@/lib/cache-manager";

export function TransactionForm({ isOpen, onClose, onSuccess }: TransactionFormProps) {
    const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSplit, setShowSplit] = useState(false);
    const [lastAddedTransaction, setLastAddedTransaction] = useState<any>(null);
    const { success: toastSuccess } = useToast();
    const haptics = useHaptics();
    const [error, setError] = useState<string | null>(null);

    // Load categories when type changes
    const loadCategories = async (type: "expense" | "income") => {
        try {
            const response = await fetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                const filteredCats = result.data.filter((c: Category) => c.type === type);
                setCategories(filteredCats);

                // Auto-suggest category based on context if none selected
                if (!selectedCategory) {
                    const prediction = predictCategory({ time: new Date() });
                    const suggested = filteredCats.find((c: Category) => c.name === prediction.suggestedCategory);
                    if (suggested) {
                        setSelectedCategory(suggested.id);
                    }
                }
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    };

    // Load categories on mount and when type changes
    useEffect(() => {
        if (isOpen) {
            loadCategories(transactionType);
        }
    }, [isOpen, transactionType]);

    // Listen for smart input data
    useEffect(() => {
        const handleSmartInput = (e: CustomEvent) => {
            const data = e.detail;
            if (data) {
                setAmount(data.amount?.toString() || "");
                setDescription(data.description || data.merchantName || "");
                // Try to auto-select category
                if (data.category) {
                    const cat = categories.find(c => c.name === data.category);
                    if (cat) {
                        setSelectedCategory(cat.id);
                    }
                }
            }
        };

        window.addEventListener("smartInputData", handleSmartInput as EventListener);
        return () => window.removeEventListener("smartInputData", handleSmartInput as EventListener);
    }, [categories]);

    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategory(categoryId);
    };

    const handleSubmit = async () => {
        if (!selectedCategory || !description) {
            setError("Lengkapi semua field");
            haptics.error();
            return;
        }

        setLoading(true);
        haptics.tap();
        setError(null);

        const parsedAmount = parseFloat(amount);
        const transData = {
            amount: parsedAmount,
            description,
            categoryId: selectedCategory,
            type: transactionType,
            paymentMethod: "cash",
            date: new Date().toISOString(),
        };

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transData),
            });

            const result = await response.json();

            if (result.success || !response.ok) {
                if (!response.ok) {
                    OfflineManager.queueTransaction(transData);
                }

                // Show success feedback with Time-Cost
                const settingsRes = await fetch("/api/profile");
                const profile = await settingsRes.json();
                const hourlyRate = profile.data?.user?.hourlyRate || 50000;
                const hours = parsedAmount / hourlyRate;

                toastSuccess(
                    "Transaksi Berhasil!",
                    `Setara dengan ${hours.toFixed(1)} jam kerja kamu.`
                );
                haptics.success();

                // Cache merchant prediction for future
                if (description) {
                    const matchedCat = categories.find(c => c.id === selectedCategory);
                    if (matchedCat) {
                        CacheManager.setCategory(description, matchedCat.name);
                    }
                }

                // Check if we should show split bill (e.g. amount > 50k and category is Food or Shopping)
                const selectedCatObj = categories.find(c => c.id === selectedCategory);
                if (selectedCatObj && (selectedCatObj.name === "Makan & Minuman" || selectedCatObj.name === "Belanja") && parsedAmount > 50000) {
                    setLastAddedTransaction({ ...transData, id: result.data?.id });
                    setShowSplit(true);
                } else {
                    onSuccess?.();
                    onClose();
                    // Reset form
                    setAmount("");
                    setDescription("");
                    setSelectedCategory(null);
                    setTransactionType("expense");
                }
            } else {
                setError(result.error || "Gagal menyimpan transaksi");
            }
        } catch (err) {
            console.error(err);
            // Handle network error via offline queue
            OfflineManager.queueTransaction(transData);
            onSuccess?.();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount("");
        setDescription("");
        setSelectedCategory(null);
        setTransactionType("expense");
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

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
                            onClick={handleClose}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Transaksi Baru
                        </h2>
                        <div className="w-10" />
                    </div>

                    <div className="p-6 space-y-8">
                        <AnimatePresence>
                            {showSplit && lastAddedTransaction && (
                                <SplitBillFlow
                                    isOpen={showSplit}
                                    onClose={() => {
                                        setShowSplit(false);
                                        onSuccess?.();
                                        onClose();
                                    }}
                                    transaction={lastAddedTransaction}
                                />
                            )}
                        </AnimatePresence>
                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <section className="space-y-6">
                            {/* Type Toggle */}
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <button
                                    onClick={() => setTransactionType("expense")}
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
                                    onClick={() => setTransactionType("income")}
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
                            </div>

                            {/* Amount & Description Section */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Nominal</p>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">Rp</div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-12 pr-4 py-4 text-2xl font-bold bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Deskripsi</p>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Contoh: Makan siang di warteg"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Kategori</p>
                                {selectedCategory && (
                                    <span className="text-[10px] font-bold text-sky-500 uppercase">Terpilih</span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {categories.map((cat) => {
                                    const Icon = categoryIcons[cat.icon] || Wallet;
                                    const isSelected = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.id)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                                isSelected
                                                    ? transactionType === "expense"
                                                        ? "border-rose-300 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/20"
                                                        : "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                                                    : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                            )}
                                        >
                                            <div className="w-9 h-9 rounded-xl mb-2 flex items-center justify-center relative z-10" style={{ backgroundColor: cat.color + "15" }}>
                                                <Icon size={18} style={{ color: cat.color }} />
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-white text-xs relative z-10">{cat.name}</p>
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="selected-check"
                                                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="pt-4 pb-12 sticky bottom-0 bg-gradient-to-t from-sky-50/80 via-sky-50/40 to-transparent dark:from-slate-900 dark:via-slate-900/40 mt-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !amount || !selectedCategory || !description}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all",
                                    loading || !amount || !selectedCategory || !description
                                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                                        : transactionType === "expense"
                                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                            : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                )}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Menyimpan...</span>
                                    </div>
                                ) : "Simpan Transaksi"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}