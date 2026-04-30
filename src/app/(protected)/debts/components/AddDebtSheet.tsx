"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { Debt } from "../types";
import { stripOrigTag } from "../utils";

export function AddDebtSheet({
    isOpen,
    onClose,
    onSuccess,
    editingDebt,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingDebt?: Debt | null;
}) {
    const [direction, setDirection] = useState<"owe" | "owed">("owe");
    const [debtorName, setDebtorName] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (editingDebt) {
            setDirection(editingDebt.direction);
            setDebtorName(editingDebt.debtorName);
            setAmount(editingDebt.amount.toString());
            setDescription(stripOrigTag(editingDebt.description));
            setDueDate(editingDebt.dueDate ? new Date(editingDebt.dueDate).toISOString().split("T")[0] : "");
        } else {
            reset();
        }
    }, [editingDebt]);

    const reset = () => {
        setDebtorName(""); setAmount(""); setDescription(""); setDueDate(""); setDirection("owe");
    };

    const handleSubmit = async () => {
        if (!debtorName.trim() || !amount) return;
        setLoading(true);
        try {
            const body = {
                debtorName,
                amount: parseFloat(amount),
                description,
                dueDate: dueDate || null,
                direction,
            };

            let res;
            if (editingDebt) {
                res = await apiFetch(`/api/debts/${editingDebt.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await apiFetch("/api/debts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }
            if (res.ok || res.status === 200) {
                toast.success("Berhasil", editingDebt ? "Hutang diperbarui!" : direction === "owe" ? "Hutang dicatat!" : "Piutang dicatat!");
                reset();
                onClose();
                onSuccess();
            } else {
                toast.error("Gagal", "Coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem] p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">{editingDebt ? "Edit" : "Catat"} Hutang / Piutang</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jenis</label>
                                <div className="flex gap-2 mb-5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        onClick={() => setDirection("owe")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            direction === "owe"
                                                ? "bg-rose-500 text-white shadow-sm"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        Saya Berhutang
                                    </button>
                                    <button
                                        onClick={() => setDirection("owed")}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                                            direction === "owed"
                                                ? "bg-sky-500 text-white shadow-sm"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        Saya Diutangi
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        {direction === "owe" ? "Nama Kreditur" : "Nama Debitur"}
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="Contoh: Pak Budi / Shopee Paylater"
                                        value={debtorName}
                                        onChange={e => setDebtorName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="500000"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Keterangan <span className="normal-case font-medium text-muted-foreground">(opsional)</span></label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="Bayar makan siang, pinjam uang bensin..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jatuh Tempo <span className="normal-case font-medium text-muted-foreground">(opsional)</span></label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !debtorName.trim() || !amount}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                        direction === "owe"
                                            ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                                            : "bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20",
                                        (loading || !debtorName.trim() || !amount) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {loading ? "Menyimpan..." : editingDebt ? "Perbarui" : "Simpan"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}