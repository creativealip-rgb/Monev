"use client";

import { useState } from "react";
import { X, Users, MessageCircle, Send, Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SplitBillFlowProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: {
        id?: number;
        amount: number;
        description: string;
    };
}

export function SplitBillFlow({ isOpen, onClose, transaction }: SplitBillFlowProps) {
    const [participants, setParticipants] = useState<{ id: string; name: string; amount: number }[]>([
        { id: "1", name: "Saya", amount: transaction.amount }
    ]);
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleAddParticipant = () => {
        if (!newName.trim()) return;
        const updated = [...participants, { id: Date.now().toString(), name: newName, amount: 0 }];
        // Automatically redistribute even split
        const evenAmount = transaction.amount / updated.length;
        setParticipants(updated.map(p => ({ ...p, amount: evenAmount })));
        setNewName("");
    };

    const handleRemoveParticipant = (id: string) => {
        if (id === "1") return; // Can't remove self
        const updated = participants.filter(p => p.id !== id);
        const evenAmount = transaction.amount / updated.length;
        setParticipants(updated.map(p => ({ ...p, amount: evenAmount })));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Here we would create Debt records in the DB
        // For now, simulate success
        await new Promise(r => setTimeout(r, 1000));
        setIsSaving(false);
        setIsComplete(true);
        setTimeout(() => {
            onClose();
            setIsComplete(false);
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[20000]"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="fixed bottom-0 left-0 right-0 z-[20001] bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 shadow-2xl mx-auto max-w-[500px]"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Split Bill</h2>
                                <p className="text-sm text-slate-500">{transaction.description}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!isComplete ? (
                            <div className="space-y-6">
                                <div className="p-6 bg-sky-50 dark:bg-sky-900/20 rounded-3xl text-center">
                                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">Total Transaksi</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(transaction.amount)}</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partisipan</p>
                                    <div className="space-y-2">
                                        {participants.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-600">
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(p.amount)}</span>
                                                    {p.id !== "1" && (
                                                        <button onClick={() => handleRemoveParticipant(p.id)} className="text-rose-500 hover:text-rose-600">
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Nama orang lain..."
                                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                                        />
                                        <button
                                            onClick={handleAddParticipant}
                                            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                                        >
                                            Tambah
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={participants.length < 2 || isSaving}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg",
                                        participants.length < 2
                                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                            : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
                                    )}
                                >
                                    {isSaving ? "Menyimpan..." : "Posting ke Tagihan"}
                                </button>
                            </div>
                        ) : (
                            <div className="py-12 text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4">
                                    <Check size={40} strokeWidth={3} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Berhasil!</h3>
                                <p className="text-slate-500 text-sm">Tagihan hutang telah dikirim ke catatan.</p>
                                <div className="flex justify-center gap-3 pt-4">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold">
                                        <MessageCircle size={16} /> WA Reminder
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold">
                                        <Send size={16} /> Kirim Bukti
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
