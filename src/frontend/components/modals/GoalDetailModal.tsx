"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Trash2, Calendar, Trophy, TrendingUp, AlertTriangle, Check } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { GoalWithProgress } from "@/types";
import { calculateFutureValue } from "@/lib/financial-advising";

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
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
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-t-[2rem] sm:rounded-2xl p-5 overflow-y-auto max-h-[88svh] relative shadow-2xl mt-auto sm:mt-0"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="goal-detail-title"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 id="goal-detail-title" className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Detail Goal</h2>
                            <button type="button" aria-label="Tutup detail goal" onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
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
                                    type="button"
                                    onClick={() => onEdit(goal)}
                                    aria-label={`Edit ${goal.name}`}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(goal.id)}
                                    aria-label={`Hapus ${goal.name}`}
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
