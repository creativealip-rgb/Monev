"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, TrendingUp, PiggyBank, Target, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { Budget, Goal } from "@/types";

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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Tambah Budget</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {expenseCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "p-3 rounded-xl border-2 text-left transition-all",
                                            selectedCategory === cat.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-slate-100 hover:border-blue-200"
                                        )}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-sm"
                                            style={{ backgroundColor: cat.color + "20" }}
                                        >
                                            <span style={{ color: cat.color }}>●</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nominal Budget</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-3 rounded-xl font-semibold text-white transition-all",
                                loading ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {loading ? "Menyimpan..." : "Simpan Budget"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Tambah Goal</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Goal</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: MacBook Pro"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Icon</label>
                            <div className="grid grid-cols-4 gap-2">
                                {goalIcons.map((item) => (
                                    <button
                                        key={item.icon}
                                        onClick={() => setSelectedIcon(item)}
                                        className={cn(
                                            "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all",
                                            selectedIcon.icon === item.icon
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-slate-100 hover:border-blue-200"
                                        )}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: item.color + "20" }}
                                        >
                                            <span style={{ color: item.color }}>●</span>
                                        </div>
                                        <span className="text-[10px] text-slate-600">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tabungan Saat Ini (Opsional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={currentAmount}
                                    onChange={(e) => setCurrentAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Deadline (Opsional)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-3 rounded-xl font-semibold text-white transition-all",
                                loading ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {loading ? "Menyimpan..." : "Simpan Goal"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Edit Budget: {budget.category}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Limit Baru</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-3 rounded-xl font-semibold text-white transition-all",
                                loading ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {loading ? "Menyimpan..." : "Update Budget"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Edit Goal</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nama Goal</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Icon</label>
                            <div className="grid grid-cols-4 gap-2">
                                {goalIcons.map((item) => (
                                    <button
                                        key={item.icon}
                                        onClick={() => setSelectedIcon(item)}
                                        className={cn(
                                            "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all",
                                            selectedIcon.icon === item.icon
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-slate-100 hover:border-blue-200"
                                        )}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: item.color + "20" }}
                                        >
                                            <span style={{ color: item.color }}>●</span>
                                        </div>
                                        <span className="text-[10px] text-slate-600">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tabungan Saat Ini</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                                <input
                                    type="number"
                                    value={currentAmount}
                                    onChange={(e) => setCurrentAmount(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={cn(
                                "w-full py-3 rounded-xl font-semibold text-white transition-all",
                                loading ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            {loading ? "Menyimpan..." : "Update Goal"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
