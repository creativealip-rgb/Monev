import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Tag, TrendingUp, Check, AlertTriangle, Trophy, Wallet } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn, getPaymentMethod } from "@/frontend/lib/utils";
import { TransactionWithCategory, BudgetSummary, GoalWithProgress, Bill, BillPayment } from "@/types";
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
    accounts?: { id: number; name: string; type: string }[];
}

export function TransactionDetailModal({ isOpen, onClose, transaction, onEdit, onDelete, accounts = [] }: TransactionDetailModalProps) {
    if (!isOpen || !transaction) return null;

    const sourceAccount = accounts.find(a => a.id === transaction.accountId);

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

                                {(transaction.paymentMethod || transaction.accountId) && (
                                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            <Wallet size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white text-[13px]">
                                                {transaction.accountId && sourceAccount
                                                    ? sourceAccount.name
                                                    : getPaymentMethod(transaction.paymentMethod).label}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {transaction.accountId ? "Dari Akun" : "Metode Pembayaran"}
                                            </p>
                                        </div>
                                    </div>
                                )}

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

const GOAL_MILESTONES = [25, 50, 75, 100];

function calculateGoalEta(
    currentAmount: number,
    targetAmount: number,
    createdAt: string | Date
): { etaDate: Date | null; monthlyRate: number } {
    if (currentAmount <= 0 || targetAmount <= 0) {
        return { etaDate: null, monthlyRate: 0 };
    }
    const created = new Date(createdAt);
    const now = new Date();
    const monthsElapsed = Math.max(
        (now.getFullYear() - created.getFullYear()) * 12
            + (now.getMonth() - created.getMonth()),
        1
    );
    const monthlyRate = currentAmount / monthsElapsed;
    const remaining = targetAmount - currentAmount;
    if (remaining <= 0) {
        return { etaDate: null, monthlyRate };
    }
    const monthsNeeded = Math.ceil(remaining / monthlyRate);
    const etaDate = new Date(now);
    etaDate.setMonth(etaDate.getMonth() + monthsNeeded);
    return { etaDate, monthlyRate };
}

function estimateMilestoneDate(
    milestonePercent: number,
    targetAmount: number,
    monthlyRate: number,
    createdAt: string | Date
): Date | null {
    if (monthlyRate <= 0) return null;
    const milestoneAmount = (milestonePercent / 100) * targetAmount;
    const monthsNeeded = Math.ceil(milestoneAmount / monthlyRate);
    const date = new Date(createdAt);
    date.setMonth(date.getMonth() + monthsNeeded);
    return date;
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

    const isCompleted = goal.percentage >= 100;
    const { etaDate, monthlyRate } = calculateGoalEta(
        goal.currentAmount, goal.targetAmount, goal.createdAt
    );
    const hasDeadlineWarning = etaDate && goal.deadline
        && etaDate.getTime() > new Date(goal.deadline).getTime();

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
                            <div className="flex flex-col items-center py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl relative">
                                {isCompleted && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute -top-2 -right-2 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1"
                                    >
                                        <Trophy size={10} />
                                        Tercapai!
                                    </motion.div>
                                )}
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                                    style={{ backgroundColor: goal.color + "20" }}
                                >
                                    <span style={{ color: goal.color }}>{goal.icon}</span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{goal.name}</h3>
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full border mt-1",
                                    isCompleted
                                        ? "bg-emerald-50 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700"
                                        : "bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600"
                                )}>
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isCompleted ? "bg-emerald-500" : "bg-emerald-500 animate-pulse"
                                    )} />
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        isCompleted
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-slate-500 dark:text-slate-400"
                                    )}>
                                        {isCompleted ? "Goal Tercapai" : "Active Goal"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Progress Menabung</span>
                                        <span className="text-slate-900 dark:text-white">{Math.round(goal.percentage)}%</span>
                                    </div>
                                    <div className="relative w-full">
                                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(goal.percentage, 100)}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: goal.color }}
                                            />
                                        </div>
                                        {/* Milestone markers on progress bar */}
                                        <div className="absolute inset-0 flex items-center pointer-events-none">
                                            {GOAL_MILESTONES.map((ms) => (
                                                <div
                                                    key={ms}
                                                    className="absolute"
                                                    style={{ left: `${ms}%`, transform: 'translateX(-50%)' }}
                                                >
                                                    <div className={cn(
                                                        "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                                                        goal.percentage >= ms
                                                            ? "bg-emerald-500 border-emerald-400 shadow-sm"
                                                            : "bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500"
                                                    )}>
                                                        {goal.percentage >= ms && (
                                                            <Check size={8} className="text-white" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Milestone progress section */}
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                                        Pencapaian Milestone
                                    </span>
                                    <div className="space-y-2">
                                        {GOAL_MILESTONES.map((ms) => {
                                            const reached = goal.percentage >= ms;
                                            const msDate = reached && monthlyRate > 0
                                                ? estimateMilestoneDate(ms, goal.targetAmount, monthlyRate, goal.createdAt)
                                                : null;
                                            return (
                                                <div key={ms} className="flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                                        reached
                                                            ? "bg-emerald-500"
                                                            : "bg-slate-200 dark:bg-slate-700"
                                                    )}>
                                                        {reached ? (
                                                            <Check size={10} className="text-white" strokeWidth={3} />
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">{ms}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-between">
                                                        <span className={cn(
                                                            "text-[11px] font-bold",
                                                            reached
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-slate-400 dark:text-slate-500"
                                                        )}>
                                                            {ms}% — {formatCurrency((ms / 100) * goal.targetAmount)}
                                                        </span>
                                                        {reached && msDate && (
                                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 tabular-nums">
                                                                ~{format(msDate, "MMM yyyy", { locale: id })}
                                                            </span>
                                                        )}
                                                        {!reached && (
                                                            <span className="text-[9px] text-slate-300 dark:text-slate-600 italic">
                                                                Belum tercapai
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ETA Section */}
                                {!isCompleted && (
                                    <div className={cn(
                                        "p-3 rounded-xl border text-[11px]",
                                        hasDeadlineWarning
                                            ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
                                            : "bg-sky-50/80 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800"
                                    )}>
                                        <div className={cn(
                                            "flex items-center gap-1.5 font-bold mb-1",
                                            hasDeadlineWarning
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-sky-600 dark:text-sky-400"
                                        )}>
                                            <TrendingUp size={12} />
                                            <span>Estimasi Pencapaian</span>
                                        </div>
                                        {goal.currentAmount > 0 && etaDate ? (
                                            <div className="space-y-1">
                                                <p className={cn(
                                                    "font-bold text-[13px]",
                                                    hasDeadlineWarning
                                                        ? "text-amber-700 dark:text-amber-300"
                                                        : "text-sky-700 dark:text-sky-300"
                                                )}>
                                                    {etaDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-slate-500 dark:text-slate-400">
                                                    Rata-rata nabung: <b className="tabular-nums">{formatCurrency(monthlyRate)}</b>/bulan
                                                </p>
                                                {hasDeadlineWarning && (
                                                    <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 font-bold">
                                                        <AlertTriangle size={11} />
                                                        <span>Perlu ditingkatkan! ETA melebihi deadline.</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 dark:text-slate-400 italic">
                                                Mulai menabung untuk melihat estimasi
                                            </p>
                                        )}
                                    </div>
                                )}

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
        </Portal>
    );
}

interface BillHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: Bill | null;
}

export function BillHistoryModal({ isOpen, onClose, bill }: BillHistoryModalProps) {
    const [history, setHistory] = useState<BillPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && bill) {
            loadHistory();
        }
    }, [isOpen, bill]);

    async function loadHistory() {
        if (!bill) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/bills/${bill.id}/history`);
            const result = await res.json();
            if (result.success) {
                setHistory(result.data);
            }
        } catch (error) {
            console.error("Error loading bill history:", error);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen || !bill) return null;

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
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Riwayat Pembayaran</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: bill.color + "20" }}>
                                    <span style={{ color: bill.color }} className="font-bold">{bill.icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{bill.name}</h3>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(bill.amount)} / {bill.frequency}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Log Pembayaran</h4>

                                {loading ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">Memuat riwayat...</div>
                                ) : history.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        Belum ada riwayat pembayaran tercatat.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {history.map((item, i) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                        <Check size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-foreground">
                                                            {format(new Date(item.paidAt), "d MMMM yyyy", { locale: id })}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">{item.notes || "Pembayaran lunas"}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[12px] font-bold text-foreground tabular-nums">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </Portal>
    );
}
