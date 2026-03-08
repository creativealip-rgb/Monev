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
import { apiFetch } from "@/frontend/lib/api-client";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { useSecurity } from "@/components/SecurityProvider";
import { encryptData } from "@/lib/encryption";


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
    const [transactionType, setTransactionType] = useState<"expense" | "income" | "transfer">("expense");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSplit, setShowSplit] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const { accounts, isLoading: accountsLoading } = useAccountsData();
    const { encryptionKey } = useSecurity();

    const [lastAddedTransaction, setLastAddedTransaction] = useState<any>(null);
    const { success: toastSuccess } = useToast();
    const haptics = useHaptics();
    const [error, setError] = useState<string | null>(null);
    const [targetAccountId, setTargetAccountId] = useState<number | null>(null);

    // Load categories when type changes
    const loadCategories = async (type: "expense" | "income" | "transfer") => {
        try {
            const response = await apiFetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                const filteredCats = result.data.filter((c: Category) => {
                    if (type === "transfer") return c.name === "Transfer";
                    return c.type === type;
                });
                setCategories(filteredCats);

                // Auto-select Transfer category if type is transfer
                if (type === "transfer") {
                    const transferCat = filteredCats.find((c: Category) => c.name === "Transfer");
                    if (transferCat) setSelectedCategory(transferCat.id);
                } else if (!selectedCategory || categories.find(c => c.id === selectedCategory)?.name === "Transfer") {
                    // Auto-suggest category based on context
                    const prediction = predictCategory({ time: new Date() });
                    const suggested = filteredCats.find((c: Category) => c.name === prediction.suggestedCategory);
                    if (suggested) {
                        setSelectedCategory(suggested.id);
                    } else {
                        setSelectedCategory(null);
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
        let finalDescription = description;

        // Encrypt description if key is available
        if (encryptionKey) {
            try {
                const encrypted = await encryptData(description, encryptionKey);
                finalDescription = `enc:${encrypted}`; // Mark as encrypted
            } catch (e) {
                console.error("Encryption failed", e);
            }
        }

        const transData = {
            amount: parsedAmount,
            description: finalDescription,
            categoryId: selectedCategory,
            type: transactionType,
            paymentMethod: "cash",
            accountId: selectedAccountId,
            targetAccountId: transactionType === 'transfer' ? targetAccountId : null,
            date: new Date().toISOString(),
        };

        try {
            const response = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transData),
            });

            if (!response.ok) {
                // Server error or offline — queue for later
                await OfflineManager.queueTransaction(transData);
                window.dispatchEvent(new CustomEvent("transactionAdded"));
                toastSuccess(
                    "Antrean Offline",
                    "Internet bermasalah, transaksi masuk antrean."
                );
                onSuccess?.();
                onClose();
                setAmount("");
                setDescription("");
                setSelectedCategory(null);
                setTransactionType("expense");
                return;
            }

            const result = await response.json();

            if (result.success) {
                // Dispatch event so all hooks (dashboard, transactions, accounts) refresh
                window.dispatchEvent(new CustomEvent("transactionAdded"));

                // Show success feedback with Time-Cost
                const settingsRes = await apiFetch("/api/profile");
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
            await OfflineManager.queueTransaction(transData);
            window.dispatchEvent(new CustomEvent("transactionAdded"));
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
                                <button
                                    onClick={() => setTransactionType("transfer")}
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

                        {/* Account Selection */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    {transactionType === 'transfer' ? 'Dari Saldo' : 'Sumber Saldo'}
                                </p>
                                {selectedAccountId && (
                                    <span className="text-[10px] font-bold text-sky-500 uppercase">Terpilih</span>
                                )}
                            </div>
                            {accountsLoading ? (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="min-w-[120px] h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {accounts.map((acc) => {
                                        const isSelected = selectedAccountId === acc.id;
                                        return (
                                            <button
                                                key={acc.id}
                                                onClick={() => setSelectedAccountId(acc.id)}
                                                className={cn(
                                                    "min-w-[140px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                                    isSelected
                                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                                                        : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                )}
                                            >
                                                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{acc.name}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Rp {acc.balance.toLocaleString('id-ID')}</p>
                                            </button>
                                        );
                                    })}
                                    {accounts.length === 0 && (
                                        <div className="text-xs text-slate-400 italic py-2">Belum ada akun saldo.</div>
                                    )}
                                </div>
                            )}
                        </section>

                        {transactionType === 'transfer' && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Ke Saldo</p>
                                    {targetAccountId && (
                                        <span className="text-[10px] font-bold text-sky-500 uppercase">Terpilih</span>
                                    )}
                                </div>
                                {accountsLoading ? (
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="min-w-[120px] h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {accounts.filter(a => a.id !== selectedAccountId).map((acc) => {
                                            const isSelected = targetAccountId === acc.id;
                                            return (
                                                <button
                                                    key={acc.id}
                                                    onClick={() => setTargetAccountId(acc.id)}
                                                    className={cn(
                                                        "min-w-[140px] p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                                        isSelected
                                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                            : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                    )}
                                                >
                                                    <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{acc.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Rp {acc.balance.toLocaleString('id-ID')}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}

                        {transactionType !== 'transfer' && (
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
                        )}

                        <div className="pt-4 pb-12 sticky bottom-0 bg-gradient-to-t from-sky-50/80 via-sky-50/40 to-transparent dark:from-slate-900 dark:via-slate-900/40 mt-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !amount || !selectedCategory || !description || (transactionType === 'transfer' && !targetAccountId)}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all",
                                    loading || !amount || !selectedCategory || !description || (transactionType === 'transfer' && !targetAccountId)
                                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                                        : transactionType === "expense"
                                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                            : transactionType === "income"
                                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                                : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
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