import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Tag, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { TransactionWithCategory, BudgetSummary, GoalWithProgress } from "@/types";
import { calculateFutureValue } from "@/lib/financial-advising";

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionWithCategory | null;
    onEdit: (t: TransactionWithCategory) => void;
    onDelete: (id: number) => void;
}

export function TransactionDetailModal({ isOpen, onClose, transaction, onEdit, onDelete }: TransactionDetailModalProps) {
    if (!isOpen || !transaction) return null;

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-5 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Detail Transaksi</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Total Nominal</span>
                                <h3 className={cn(
                                    "text-2xl font-bold tabular-nums tracking-tight",
                                    transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                )}>
                                    {formatCurrency(transaction.amount)}
                                </h3>
                                <div className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mt-2",
                                    transaction.type === 'income' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                )}>
                                    {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                                        <Tag size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-[13px] truncate">{transaction.description}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{transaction.categoryName || "Tanpa Kategori"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                        <Calendar size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-[13px]">
                                            {format(new Date(transaction.createdAt), "d MMMM yyyy", { locale: id })}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Pukul {format(new Date(transaction.createdAt), "HH:mm")} WIB
                                        </p>
                                    </div>
                                </div>

                                {transaction.isVerified && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Terverifikasi AI
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={() => onEdit(transaction)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(transaction.id)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={16} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}

interface BudgetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: BudgetSummary | null;
    onEdit: (b: BudgetSummary) => void;
    onDelete: (id: number) => void;
}

export function BudgetDetailModal({ isOpen, onClose, budget, onEdit, onDelete }: BudgetDetailModalProps) {
    if (!isOpen || !budget) return null;

    const percentage = Math.round(budget.percentage);
    const isDanger = percentage > 90;
    const isWarning = percentage > 75;

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-5 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Detail Budget</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-xl shadow-sky-500/20">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">Kategori</span>
                                <h3 className="text-lg font-bold mb-3 tracking-tight">{budget.category}</h3>

                                <div className="space-y-1 mb-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="opacity-60">Pemakaian</span>
                                        <span className="text-cyan-200">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700",
                                                isDanger ? "bg-rose-400" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                                            )}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-3">
                                    <div>
                                        <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider block mb-0.5">Terpakai</span>
                                        <span className="font-bold text-sm tracking-tight tabular-nums">{formatCurrency(budget.spent)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider block mb-0.5">Limit</span>
                                        <span className="font-bold text-sm tracking-tight tabular-nums">{formatCurrency(budget.limit)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={() => onEdit(budget)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(budget.id)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={16} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}

interface GoalDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: GoalWithProgress | null;
    onEdit: (g: GoalWithProgress) => void;
    onDelete: (id: number) => void;
}

export function GoalDetailModal({ isOpen, onClose, goal, onEdit, onDelete }: GoalDetailModalProps) {
    if (!isOpen || !goal) return null;

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-5 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Detail Goal</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col items-center py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                                    style={{ backgroundColor: goal.color + "20" }}
                                >
                                    <span style={{ color: goal.color }}>{goal.icon}</span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{goal.name}</h3>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-600 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Goal</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Progress Menabung</span>
                                        <span className="text-slate-900 dark:text-white">{Math.round(goal.percentage)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: goal.color }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Terkumpul</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-[13px] tracking-tight tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Target</span>
                                        <span className="font-bold text-slate-900 dark:text-white text-[13px] tracking-tight tabular-nums">{formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>

                                {goal.deadline && (
                                    <div className="flex items-center gap-2 p-2.5 bg-sky-50/50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl text-[11px] font-medium">
                                        <Calendar size={14} />
                                        <span>Deadline: <b className="font-bold">{format(new Date(goal.deadline), "d MMM yyyy", { locale: id })}</b></span>
                                    </div>
                                )}


                                {goal.deadline && (
                                    (() => {
                                        const now = new Date();
                                        const deadlineDate = new Date(goal.deadline);
                                        const diffTime = deadlineDate.getTime() - now.getTime();
                                        const diffDays = diffTime / (1000 * 3600 * 24);
                                        const diffYears = diffDays / 365;

                                        if (diffYears > 0.5) {
                                            const futureVal = calculateFutureValue(goal.targetAmount, diffYears);
                                            return (
                                                <div className="p-2.5 bg-amber-50/80 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px]">
                                                    <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-600 dark:text-amber-400">
                                                        <TrendingUp size={12} />
                                                        <span>Waspada Inflasi (Est. 5%/thn)</span>
                                                    </div>
                                                    <p className="leading-relaxed">
                                                        Estimasi target di masa depan: <b className="text-amber-700 dark:text-amber-300 tabular-nums">{formatCurrency(futureVal)}</b>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={() => onEdit(goal)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(goal.id)}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={16} />
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal >
    );
}
