import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { Transaction, Budget, Goal } from "@/types";

// Portal helper to render outside the main layout container
function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

// Inline styles to guarantee modal centering - not relying on Tailwind
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999999, // Super high z-index to stay on top
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backdropFilter: 'blur(4px)',
};

const modalCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: '28rem',
    borderRadius: '1.5rem',
    padding: '1.25rem',
    paddingBottom: '2rem',
    overflowY: 'auto',
    maxHeight: '85vh',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

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
                    style={overlayStyle}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={modalCardStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Detail Transaksi</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center py-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Nominal</span>
                                <h3 className={cn(
                                    "text-3xl font-bold",
                                    transaction.type === 'income' ? "text-emerald-600" : "text-slate-900"
                                )}>
                                    {formatCurrency(transaction.amount)}
                                </h3>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2",
                                    transaction.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                )}>
                                    {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <Tag size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">{transaction.description}</p>
                                        <p className="text-xs text-slate-500">{transaction.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 text-sm">
                                            {format(new Date(transaction.created_at), "d MMMM yyyy", { locale: id })}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Pukul {format(new Date(transaction.created_at), "HH:mm")} WIB
                                        </p>
                                    </div>
                                </div>

                                {transaction.is_verified && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-wider italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Terverifikasi AI
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => onEdit(transaction)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(transaction.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all active:scale-95"
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
                    style={overlayStyle}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={modalCardStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Detail Budget</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block mb-1">Kategori</span>
                                <h3 className="text-2xl font-bold mb-4">{budget.category}</h3>

                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="opacity-60 uppercase tracking-wider">Pemakaian</span>
                                        <span className="text-blue-200">{percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700",
                                                isDanger ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                                            )}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] opacity-40 uppercase font-bold tracking-wider block">Terpakai</span>
                                        <span className="font-bold text-sm tracking-tight">{formatCurrency(budget.spent)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] opacity-40 uppercase font-bold tracking-wider block">Limit</span>
                                        <span className="font-bold text-sm tracking-tight">{formatCurrency(budget.limit)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => onEdit(budget)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(budget.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all active:scale-95"
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
                    style={overlayStyle}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={modalCardStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Detail Goal</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div
                                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-sm"
                                    style={{ backgroundColor: goal.color + "15" }}
                                >
                                    <span style={{ color: goal.color }}>{goal.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">{goal.name}</h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Goal</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-400 uppercase tracking-wider">Progress Menabung</span>
                                        <span className="text-slate-900">{Math.round(goal.percentage)}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
                                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Terkumpul</span>
                                        <span className="font-bold text-slate-900 tracking-tight">{formatCurrency(goal.saved)}</span>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target</span>
                                        <span className="font-bold text-slate-900 tracking-tight">{formatCurrency(goal.target)}</span>
                                    </div>
                                </div>

                                {goal.deadline && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 text-blue-700 rounded-2xl text-xs font-medium">
                                        <Calendar size={16} />
                                        <span>Deadline: <b className="font-bold">{format(new Date(goal.deadline), "d MMM yyyy", { locale: id })}</b></span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => onEdit(goal)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(goal.id)}
                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all active:scale-95"
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
