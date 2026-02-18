import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Tag, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { Transaction, Budget, Goal } from "@/types";
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
    transaction: Transaction | null;
    onEdit: (t: Transaction) => void;
    onDelete: (id: string) => void;
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Transaksi</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex flex-col items-center justify-center py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Total Nominal</span>
                                <h3 className={cn(
                                    "text-3xl font-black tabular-nums tracking-tight",
                                    transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                )}>
                                    {formatCurrency(transaction.amount)}
                                </h3>
                                <div className={cn(
                                    "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full mt-3",
                                    transaction.type === 'income' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                )}>
                                    {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                                        <Tag size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{transaction.description}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                                            {format(new Date(transaction.created_at), "d MMMM yyyy", { locale: id })}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Pukul {format(new Date(transaction.created_at), "HH:mm")} WIB
                                        </p>
                                    </div>
                                </div>

                                {transaction.is_verified && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Terverifikasi AI
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => onEdit(transaction)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(transaction.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={18} />
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Budget</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-xl shadow-sky-500/20">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">Kategori</span>
                                <h3 className="text-2xl font-black mb-5 tracking-tight">{budget.category}</h3>

                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="opacity-60">Pemakaian</span>
                                        <span className="text-cyan-200">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700",
                                                isDanger ? "bg-rose-400" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                                            )}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                    <div>
                                        <span className="text-[9px] opacity-50 uppercase font-black tracking-widest block mb-0.5">Terpakai</span>
                                        <span className="font-bold text-base tracking-tight tabular-nums">{formatCurrency(budget.spent)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] opacity-50 uppercase font-black tracking-widest block mb-0.5">Limit</span>
                                        <span className="font-bold text-base tracking-tight tabular-nums">{formatCurrency(budget.limit)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => onEdit(budget)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(budget.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={18} />
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
    goal: Goal | null;
    onEdit: (g: Goal) => void;
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[85vh] relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Goal</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex flex-col items-center py-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 shadow-sm"
                                    style={{ backgroundColor: goal.color + "20" }}
                                >
                                    <span style={{ color: goal.color }}>{goal.icon}</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{goal.name}</h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Goal</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Progress Menabung</span>
                                        <span className="text-slate-900 dark:text-white">{Math.round(goal.percentage)}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${goal.percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: goal.color }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Terkumpul</span>
                                        <span className="font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{formatCurrency(goal.saved)}</span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Target</span>
                                        <span className="font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{formatCurrency(goal.target)}</span>
                                    </div>
                                </div>

                                {goal.deadline && (
                                    <div className="flex items-center gap-3 p-3 bg-sky-50/50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-xl text-xs font-medium">
                                        <Calendar size={16} />
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
                                            const futureVal = calculateFutureValue(goal.target, diffYears);
                                            return (
                                                <div className="p-3 bg-amber-50/80 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs shadow-sm">
                                                    <div className="flex items-center gap-2 font-bold mb-1 text-amber-600 dark:text-amber-400">
                                                        <TrendingUp size={14} />
                                                        <span>Waspada Inflasi (Est. 5%/thn)</span>
                                                    </div>
                                                    <p className="leading-relaxed">
                                                        Untuk daya beli yang sama, estimasi target ini di masa depan adalah <b className="text-amber-700 dark:text-amber-300 underline underline-offset-2 tabular-nums">{formatCurrency(futureVal)}</b>.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => onEdit(goal)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(goal.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                    <Trash2 size={18} />
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
