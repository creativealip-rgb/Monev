"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { BudgetSummary } from "@/types";
import { Portal } from "@/frontend/components/Portal";
import { apiFetch } from "@/frontend/lib/api-client";

interface Category {
    id: number;
    name: string;
    color: string;
    type: "expense" | "income";
}

interface AddBudgetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    categories: Category[];
    month: number;
    year: number;
}

export function AddBudgetForm({ isOpen, onClose, onSuccess, categories, month, year }: AddBudgetFormProps) {
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enableRollover, setEnableRollover] = useState(true);

    const expenseCategories = categories.filter(c => c.type === "expense");

    const handleSubmit = async () => {
        if (!selectedCategory || !amount || parseFloat(amount) <= 0) {
            setError("Pilih kategori dan isi amount");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch("/api/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId: selectedCategory,
                    amount: parseFloat(amount),
                    month,
                    year,
                    enableRollover
                }),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                onClose();
                setAmount("");
                setSelectedCategory(null);
            } else {
                setError(result.error || "Gagal menambah budget");
            }
        } catch (err) {
            setError("Gagal menambah budget");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            key="add-budget-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                            onClick={onClose}
                        />
                        <motion.div
                            key="add-budget-modal"
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Tambah Budget</h2>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-[13px] font-medium flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Pilih Kategori</label>
                                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto -mx-1 px-1">
                                        {expenseCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.id)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                                    selectedCategory === category.id
                                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50"
                                                        : "border-slate-100 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: category.color + "20" }}
                                                >
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                                </div>
                                                <span className="text-[13px] font-bold text-slate-900 dark:text-white">{category.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Budget Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">Rp</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 dark:text-white">Rollover</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sisa budget bulan ini diteruskan ke bulan depan</p>
                                        </div>
                                        <button
                                            onClick={() => setEnableRollover(!enableRollover)}
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-colors relative",
                                                enableRollover ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                                enableRollover ? "left-7" : "left-1"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className={cn(
                                        "w-full py-3 rounded-xl text-sm font-bold transition-all mt-2",
                                        loading
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                            : "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/30 active:scale-[0.98]"
                                    )}
                                >
                                    {loading ? "Menyimpan..." : "Simpan Budget"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}

interface EditBudgetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    budget: BudgetSummary;
}

export function EditBudgetForm({ isOpen, onClose, onSuccess, budget }: EditBudgetFormProps) {
    const [amount, setAmount] = useState(budget.limit.toString());

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;

        try {
            const response = await apiFetch(`/api/budgets/${budget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(amount) }),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            console.error("Failed to update budget:", err);
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            key="edit-budget-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                            onClick={onClose}
                        />
                        <motion.div
                            key="edit-budget-modal"
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Edit Budget</h2>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400">Kategori</span>
                                    <span className="text-[13px] font-bold text-slate-900 dark:text-white">{budget.category}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400">Terpakai</span>
                                    <span className="text-[13px] font-bold text-slate-900 dark:text-white">{formatCurrency(budget.spent)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Budget Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">Rp</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-base font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 transition-all mt-4 shadow-lg shadow-sky-500/30 active:scale-[0.98]"
                            >
                                Simpan Perubahan
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}