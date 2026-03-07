"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, TrendingUp, PiggyBank, Target, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { BudgetSummary, Goal } from "@/types";
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

// Portal helper safely handled within the component or usage
export function AddBudgetForm({ isOpen, onClose, onSuccess, categories, month, year }: AddBudgetFormProps) {
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enableRollover, setEnableRollover] = useState(true);

    const expenseCategories = categories.filter(c => c.type === "expense");

    const handleSubmit = async () => {
        if (!selectedCategory || !amount || parseFloat(amount) <= 0) {
            setError("Pilih kategori dan masukkan nominal");
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

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
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
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">
                                Pilih Kategori
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
                                {expenseCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all",
                                            selectedCategory === cat.id
                                                ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                                                : "border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <span
                                            className="w-5 h-5 flex items-center justify-center rounded-full text-[10px]"
                                            style={{ backgroundColor: cat.color + "20" }}
                                        >
                                            <span style={{ color: cat.color }}>●</span>
                                        </span>
                                        <span className="text-[13px] font-bold whitespace-nowrap">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">
                                Target Budget (Bulanan)
                            </label>
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

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Aktifkan Rollover</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Sisa budget bulan ini akan ditambah ke bulan depan</p>
                            </div>
                            <button
                                onClick={() => setEnableRollover(!enableRollover)}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-all relative",
                                    enableRollover ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                                )}
                            >
                                <motion.div
                                    animate={{ x: enableRollover ? 18 : 2 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                            </button>
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
            </AnimatePresence>
        </Portal>
    );
}

interface AddGoalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const goalIcons = [
    { icon: "Laptop", label: "Laptop", color: "#3b82f6" },
    { icon: "Plane", label: "Travel", color: "#f97316" },
    { icon: "Home", label: "Rumah", color: "#22c55e" },
    { icon: "Car", label: "Mobil", color: "#a855f7" },
    { icon: "Smartphone", label: "HP", color: "#ec4899" },
    { icon: "Shield", label: "Dana Darurat", color: "#14b8a6" },
    { icon: "GraduationCap", label: "Pendidikan", color: "#6366f1" },
    { icon: "Heart", label: "Kesehatan", color: "#ef4444" },
];

export function AddGoalForm({ isOpen, onClose, onSuccess }: AddGoalFormProps) {
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [selectedIcon, setSelectedIcon] = useState(goalIcons[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!name || !targetAmount || parseFloat(targetAmount) <= 0) {
            setError("Isi nama goal dan target amount");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    targetAmount: parseFloat(targetAmount),
                    currentAmount: parseFloat(currentAmount) || 0,
                    deadline: deadline || undefined,
                    icon: selectedIcon.icon,
                    color: selectedIcon.color,
                }),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                onClose();
                setName("");
                setTargetAmount("");
                setCurrentAmount("");
                setDeadline("");
            } else {
                setError(result.error || "Gagal menambah goal");
            }
        } catch (err) {
            setError("Gagal menambah goal");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    key="add-goal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                    onClick={onClose}
                />
                <motion.div
                    key="add-goal-modal"
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Tambah Goal</h2>
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
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Nama Goal</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: MacBook Pro"
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">
                                Pilih Icon
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                {goalIcons.map((item) => (
                                    <button
                                        key={item.icon}
                                        onClick={() => setSelectedIcon(item)}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all",
                                            selectedIcon.icon === item.icon
                                                ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                                                : "border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: item.color + "20" }}
                                        >
                                            <span style={{ color: item.color }}>●</span>
                                        </div>
                                        <span className="text-[13px] font-bold whitespace-nowrap">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Tabungan Awal</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-[10px]">Rp</span>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white"
                                />
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
                            {loading ? "Menyimpan..." : "Simpan Goal"}
                        </button>
                    </div>
                </motion.div>
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enableRollover, setEnableRollover] = useState(budget.enableRollover || false);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError("Masukkan nominal limit yang valid");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch(`/api/budgets/${budget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    enableRollover
                }),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || "Gagal mengupdate budget");
            }
        } catch (err) {
            setError("Gagal mengupdate budget");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
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
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Edit Budget: {budget.category}</h2>
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
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">
                                Limit Baru
                            </label>
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

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Aktifkan Rollover</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Sisa budget bulan ini akan ditambah ke bulan depan</p>
                            </div>
                            <button
                                onClick={() => setEnableRollover(!enableRollover)}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-all relative",
                                    enableRollover ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                                )}
                            >
                                <motion.div
                                    animate={{ x: enableRollover ? 18 : 2 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                            </button>
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
                            {loading ? "Menyimpan..." : "Update Budget"}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}

interface EditGoalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    goal: Goal;
}

export function EditGoalForm({ isOpen, onClose, onSuccess, goal }: EditGoalFormProps) {
    const [name, setName] = useState(goal.name);
    const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString());
    const [currentAmount, setCurrentAmount] = useState(goal.currentAmount.toString());
    const [deadline, setDeadline] = useState(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "");
    const [selectedIcon, setSelectedIcon] = useState(goalIcons.find(i => i.icon === goal.icon) || goalIcons[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!name || !targetAmount || parseFloat(targetAmount) <= 0) {
            setError("Isi nama goal dan target amount");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiFetch(`/api/goals/${goal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    targetAmount: parseFloat(targetAmount),
                    currentAmount: parseFloat(currentAmount) || 0,
                    deadline: deadline || undefined,
                    icon: selectedIcon.icon,
                    color: selectedIcon.color,
                }),
            });

            const result = await response.json();

            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || "Gagal mengupdate goal");
            }
        } catch (err) {
            setError("Gagal mengupdate goal");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    key="edit-goal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                    onClick={onClose}
                />
                <motion.div
                    key="edit-goal-modal"
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 pb-10 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Edit Goal</h2>
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
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Nama Goal</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">
                                Pilih Icon
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                {goalIcons.map((item) => (
                                    <button
                                        key={item.icon}
                                        onClick={() => setSelectedIcon(item)}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all",
                                            selectedIcon.icon === item.icon
                                                ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                                                : "border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-200 dark:hover:border-sky-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: item.color + "20" }}
                                        >
                                            <span style={{ color: item.color }}>●</span>
                                        </div>
                                        <span className="text-[13px] font-bold whitespace-nowrap">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">Rp</span>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Tabungan Saat Ini</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-[10px]">Rp</span>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block pl-1">Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all text-[13px] font-medium text-slate-900 dark:text-white"
                                />
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
                            {loading ? "Menyimpan..." : "Update Goal"}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}
