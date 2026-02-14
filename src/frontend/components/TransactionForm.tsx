"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Wallet, TrendingUp, Utensils, Car, Gamepad2, ShoppingBag, Heart, BookOpen, Receipt, TrendingUp as InvestIcon, Banknote, Briefcase, MoreHorizontal } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

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
    "Wallet": Wallet,
};

export function TransactionForm({ isOpen, onClose, onSuccess }: TransactionFormProps) {
    const [step, setStep] = useState<"type" | "amount" | "category" | "details">("type");
    const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load categories when opening
    const loadCategories = async (type: "expense" | "income") => {
        try {
            const response = await fetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                setCategories(result.data.filter((c: Category) => c.type === type));
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    };

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

    const handleTypeSelect = async (type: "expense" | "income") => {
        setTransactionType(type);
        await loadCategories(type);
        setStep("amount");
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
        if (!selectedCategory || !description) {
            setError("Lengkapi semua field");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description,
                    categoryId: selectedCategory,
                    type: transactionType,
                    paymentMethod: "cash",
                    date: new Date().toISOString(),
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                // Reset form
                setStep("type");
                setAmount("");
                setDescription("");
                setSelectedCategory(null);
                
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
        setStep("type");
        setAmount("");
        setDescription("");
        setSelectedCategory(null);
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
                {/* Background */}
                <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-100">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200/30 via-transparent to-transparent" />
                </div>

                {/* Container */}
                <div className="min-h-screen max-w-[500px] mx-auto bg-slate-50/40 backdrop-blur-xl shadow-2xl shadow-blue-900/10">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
                    <button
                        onClick={step === "type" ? handleClose : () => setStep(step === "amount" ? "type" : step === "category" ? "amount" : "category")}
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                        {step === "type" ? <X size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <h2 className="text-lg font-bold text-slate-900">
                        {step === "type" && "Tipe Transaksi"}
                        {step === "amount" && "Nominal"}
                        {step === "category" && "Kategori"}
                        {step === "details" && "Detail"}
                    </h2>
                    <div className="w-10" />
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Select Type */}
                    {step === "type" && (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-center mb-6">Pilih tipe transaksi</p>
                            <button
                                onClick={() => handleTypeSelect("expense")}
                                className="w-full p-6 rounded-2xl bg-rose-50 border-2 border-rose-100 hover:border-rose-300 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-rose-500 flex items-center justify-center">
                                        <TrendingUp className="text-white" size={28} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-900 text-lg">Pengeluaran</h3>
                                        <p className="text-slate-500 text-sm">Catat pengeluaran harian</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleTypeSelect("income")}
                                className="w-full p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-300 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center">
                                        <Wallet className="text-white" size={28} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-900 text-lg">Pemasukan</h3>
                                        <p className="text-slate-500 text-sm">Catat pemasukan/gaji</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Step 2: Enter Amount */}
                    {step === "amount" && (
                        <div className="space-y-6">
                            <div className="text-center py-8">
                                <p className="text-slate-400 text-sm mb-2">Nominal</p>
                                <div className="text-5xl font-bold text-slate-900">
                                    {amount ? formatCurrency(parseFloat(amount)) : "Rp 0"}
                                </div>
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full text-center text-3xl font-bold p-4 bg-slate-50 rounded-2xl border-none outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleAmountSubmit}
                                disabled={!amount}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-white transition-all",
                                    amount ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300"
                                )}
                            >
                                Lanjut
                            </button>
                        </div>
                    )}

                    {/* Step 3: Select Category */}
                    {step === "category" && (
                        <div className="space-y-4">
                            <p className="text-slate-500 mb-4">Pilih kategori</p>
                            <div className="grid grid-cols-2 gap-3">
                                {categories.map((cat) => {
                                    const Icon = categoryIcons[cat.icon] || Wallet;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat.id)}
                                            className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-blue-300 transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                                                <Icon size={20} style={{ color: cat.color }} />
                                            </div>
                                            <p className="font-semibold text-slate-900 text-sm">{cat.name}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Details */}
                    {step === "details" && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Deskripsi
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Makan siang di warteg"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Nominal</span>
                                    <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Kategori</span>
                                    <span className="font-semibold">{categories.find(c => c.id === selectedCategory)?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Tipe</span>
                                    <span className={cn("font-semibold", transactionType === "expense" ? "text-rose-600" : "text-emerald-600")}>
                                        {transactionType === "expense" ? "Pengeluaran" : "Pemasukan"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !description}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-white transition-all",
                                    loading || !description ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                {loading ? "Menyimpan..." : "Simpan Transaksi"}
                            </button>
                        </div>
                    )}
                </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
