"use client";

import { useState } from "react";
import { Users, ChevronDown, MessageCircle, CheckCircle } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { motion } from "framer-motion";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";

interface Debt {
    id: number;
    debtorName: string;
    amount: number;
    status: "unpaid" | "paid";
    dueDate?: Date;
    createdAt: Date;
}

interface SplitBillGroupCardProps {
    groupId: string;
    transactionDescription: string;
    totalAmount: number;
    participants: Debt[];
    paidCount: number;
    transactionId?: number;
    onRefresh?: () => void;
}

export function SplitBillGroupCard({
    groupId,
    transactionDescription,
    totalAmount,
    participants,
    paidCount,
    transactionId,
    onRefresh
}: SplitBillGroupCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [payingId, setPayingId] = useState<number | null>(null);
    const { success: toastSuccess, error: toastError } = useToast();

    const handleMarkAsPaid = async (debtId: number, debtorName: string) => {
        if (payingId) return;
        setPayingId(debtId);
        try {
            const response = await apiFetch(`/api/debts/${debtId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "paid",
                    paidAt: new Date().toISOString()
                })
            });

            const result = await response.json();
            if (result.success || response.ok) {
                toastSuccess("Berhasil!", `${debtorName} telah melunasi hutang`);
                onRefresh?.();
            } else {
                toastError("Gagal", result.error || "Gagal memperbarui status");
            }
        } catch {
            toastError("Gagal", "Coba lagi");
        } finally {
            setPayingId(null);
        }
    };

    const sendWAReminder = (participantName: string, amount: number) => {
        const message = `Hai ${participantName}! 👋

Kamu punya hutang ${formatCurrency(amount)} dari ${transactionDescription} kemarin.

Kalo udah sempat transfer ke aku ya! 😊

Thanks!`;
        
        const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-sky-100 dark:border-sky-900/30 overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
            {/* Header - Click to expand */}
            <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Tutup" : "Buka"} detail split bill ${transactionDescription}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 flex items-center justify-center">
                        <Users size={20} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                            Split Bill: {transactionDescription}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {participants.length} orang • {paidCount}/{participants.length} lunas
                        </p>
                    </div>
                </div>
                <div className="text-right flex items-center gap-3">
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {formatCurrency(totalAmount)}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Total
                        </p>
                    </div>
                    <ChevronDown
                        size={20}
                        className={cn(
                            "text-slate-400 transition-transform duration-200",
                            isExpanded ? "rotate-180" : ""
                        )}
                    />
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                >
                    <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Detail Partisipan
                        </p>
                        
                        {participants.map((participant, index) => (
                            <motion.div
                                key={participant.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {participant.debtorName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                                            {participant.debtorName}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                            {participant.status === "paid" ? "Lunas" : "Belum bayar"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "font-bold text-sm",
                                        participant.status === "paid"
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-slate-900 dark:text-white"
                                    )}>
                                        {formatCurrency(participant.amount)}
                                    </span>
                                    
                                    {participant.status === "unpaid" && (
                                        <>
                                            <button
                                                type="button"
                                                aria-label={`Tagih ${participant.debtorName} via WhatsApp`}
                                                onClick={() => sendWAReminder(participant.debtorName, participant.amount)}
                                                className="p-1.5 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                                                title="Tagih via WA"
                                            >
                                                <MessageCircle size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Tandai ${participant.debtorName} lunas`}
                                                disabled={payingId === participant.id}
                                                onClick={() => handleMarkAsPaid(participant.id, participant.debtorName)}
                                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                title="Tandai Lunas"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                        </>
                                    )}
                                    
                                    {participant.status === "paid" && (
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary Footer */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                Diterima:
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(
                                    participants
                                        .filter(p => p.status === "paid")
                                        .reduce((sum, p) => sum + p.amount, 0)
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                Belum dibayar:
                            </span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(
                                    participants
                                        .filter(p => p.status === "unpaid")
                                        .reduce((sum, p) => sum + p.amount, 0)
                                )}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
