"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, TrendingUp, PiggyBank, Target, Calendar, DollarSign } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { Budget, Goal } from "@/types";

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

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

    const expenseCategories = categories.filter(c => c.type === "expense");

    const handleSubmit = async () => {
        if (!selectedCategory || !amount || parseFloat(amount) <= 0) {
            setError("Pilih kategori dan masukkan nominal");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId: selectedCategory,
                    amount: parseFloat(amount),
                    month,
                    year,
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
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Tambah Budget</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Category Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 block pl-1">
                                Pilih Kategori
                            </label>
                            <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar">
                                {expenseCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all",
                                            selectedCategory === cat.id
                                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                                : "border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <span
                                            className="text-lg w-6 h-6 flex items-center justify-center rounded-full"
                                            style={{ backgroundColor: cat.color + "20" }}
                                        >
                                            <span style={{ color: cat.color }}>●</span>
                                        </span>
                                        <span className="text-sm font-bold whitespace-nowrap">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">
                                Target Budget (Bulanan)
                            </label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-lg font-bold text-slate-900 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                loading
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
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
            const response = await fetch("/api/goals", {
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
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Tambah Goal</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Nama Goal</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: MacBook Pro"
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Icon Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 block pl-1">
                                Pilih Icon
                            </label>
                            <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar">
                                {goalIcons.map((item) => (
                                    <button
                                        key={item.icon}
                                        onClick={() => setSelectedIcon(item)}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all",
                                            selectedIcon.icon === item.icon
                                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                                : "border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: item.color + "20" }}
                                        >
                                            <span style={{ color: item.color }}>●</span>
                                        </div>
                                        <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Amount */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-lg font-bold text-slate-900 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Current Amount & Deadline */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Tabungan Awal</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                loading
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
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
    budget: Budget;
}

export function EditBudgetForm({ isOpen, onClose, onSuccess, budget }: EditBudgetFormProps) {
    const [amount, setAmount] = useState(budget.limit.toString());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError("Masukkan nominal limit yang valid");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/budgets/${budget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
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
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Edit Budget: {budget.category}</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Amount Input */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">
                                Limit Baru
                            </label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-lg font-bold text-slate-900 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                loading
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
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
    const [targetAmount, setTargetAmount] = useState(goal.target.toString());
    const [currentAmount, setCurrentAmount] = useState(goal.saved.toString());
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
            const response = await fetch(`/api/goals/${goal.id}`, {
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
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Edit Goal</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Nama Goal</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Icon Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 block pl-1">
                                Pilih Icon
                            </label>
                            <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar">
                                {goalIcons.map((item) => (
                                    <button
                                        key={item.icon}
                                        onClick={() => setSelectedIcon(item)}
                                        className={cn(
                                            "flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all",
                                            selectedIcon.icon === item.icon
                                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                                : "border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: item.color + "20" }}
                                        >
                                            <span style={{ color: item.color }}>●</span>
                                        </div>
                                        <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Amount */}
                        <div>
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-lg font-bold text-slate-900 placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Current Amount & Deadline */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Tabungan Saat Ini</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block pl-1">Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none transition-all text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                loading
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
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
