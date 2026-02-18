import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Tag, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { Transaction, Budget, Goal } from "@/types";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onEdit: (t: Transaction) => void;
    onDelete: (id: string) => void;
}

export function TransactionDetailModal({ isOpen, onClose, transaction, onEdit, onDelete }: TransactionDetailModalProps) {
    if (!isOpen || !transaction) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[10005] flex items-end sm:items-center justify-center p-4 sm:p-0"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Transaksi</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Nominal</span>
                            <h3 className={cn(
                                "text-3xl font-bold",
                                transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                            )}>
                                {formatCurrency(transaction.amount)}
                            </h3>
                            <span className={cn(
                                "text-xs font-semibold px-2 py-1 rounded-full mt-2",
                                transaction.type === 'income' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                            )}>
                                {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deskripsi & Kategori</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{transaction.description}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{transaction.category}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Waktu Transaksi</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {format(new Date(transaction.created_at), "EEEE, d MMMM yyyy", { locale: id })}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Pukul {format(new Date(transaction.created_at), "HH:mm")} WIB
                                    </p>
                                </div>
                            </div>

                            {transaction.is_verified && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Terverifikasi oleh AI
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => onEdit(transaction)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                            >
                                <Edit2 size={18} />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(transaction.id)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                            >
                                <Trash2 size={18} />
                                Hapus
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

interface BudgetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: Budget | null;
    onEdit: (b: Budget) => void;
    onDelete: (id: number) => void;
}

export function BudgetDetailModal({ isOpen, onClose, budget, onEdit, onDelete }: BudgetDetailModalProps) {
    if (!isOpen || !budget) return null;

    const percentage = Math.round(budget.percentage);
    const isDanger = percentage > 90;
    const isWarning = percentage > 75;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[10005] flex items-end sm:items-center justify-center p-4 sm:p-0"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Budget</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-xl shadow-sky-500/20">
                            <span className="text-sm opacity-80 block mb-1">Kategori</span>
                            <h3 className="text-2xl font-bold mb-4">{budget.category}</h3>

                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-80">Terpakai</span>
                                    <span className="font-bold text-cyan-200">{percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-500",
                                            isDanger ? "bg-rose-400" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                                        )}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-xs opacity-60 block">Terpakai</span>
                                    <span className="font-semibold">{formatCurrency(budget.spent)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs opacity-60 block">Limit</span>
                                    <span className="font-semibold">{formatCurrency(budget.limit)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onEdit(budget)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                            >
                                <Edit2 size={18} />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(budget.id)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                            >
                                <Trash2 size={18} />
                                Hapus
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

interface GoalDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal | null;
    onEdit: (g: Goal) => void;
    onDelete: (id: number) => void;
}

export function GoalDetailModal({ isOpen, onClose, goal, onEdit, onDelete }: GoalDetailModalProps) {
    if (!isOpen || !goal) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[10005] flex items-end sm:items-center justify-center p-4 sm:p-0"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Goal</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center py-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                                style={{ backgroundColor: goal.color + "20" }}
                            >
                                <span style={{ color: goal.color }}>{goal.icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{goal.name}</h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Active Goal</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                                    <span className="text-slate-900 dark:text-white">{Math.round(goal.percentage)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${goal.percentage}%`, backgroundColor: goal.color }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Terkumpul</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(goal.saved)}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Target</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(goal.target)}</span>
                                </div>
                            </div>

                            {goal.deadline && (
                                <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl text-sm">
                                    <Calendar size={18} />
                                    <span>Deadline: <b>{format(new Date(goal.deadline), "d MMM yyyy", { locale: id })}</b></span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => onEdit(goal)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 font-semibold hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                            >
                                <Edit2 size={18} />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(goal.id)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                            >
                                <Trash2 size={18} />
                                Hapus
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
