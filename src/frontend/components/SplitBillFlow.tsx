"use client";

import { useState } from "react";
import { X, Users, MessageCircle, Send, Check, Divide, Sliders, Copy } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useToast } from "@/frontend/components/UI";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SplitBillFlow");

interface SplitBillFlowProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: {
        id?: number;
        amount: number;
        description: string;
    };
    onSuccess?: () => void;
}

interface Participant {
    id: string;
    name: string;
    amount: number;
    email?: string;
    whatsappNumber?: string;
    phone?: string;
    paymentToken?: string;
}

const useSplitBillToast = () => {
    const toast = useToast();
    
    const shareSuccess = () => {
        toast.success("Link invite berhasil disalin!", "Share ke WhatsApp atau Telegram");
    };
    
    const shareError = () => {
        toast.error("Gagal menyalin link", "Coba manual atau gunakan WhatsApp");
    };
    
    return { shareSuccess, shareError };
};

export function SplitBillFlow({ isOpen, onClose, transaction, onSuccess }: SplitBillFlowProps) {
    const [participants, setParticipants] = useState<Participant[]>([
        { id: "1", name: "Saya", amount: transaction.amount }
    ]);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
    const [isSaving, setIsSaving] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [publicSplitId, setPublicSplitId] = useState<string | null>(null);
    const haptics = useHaptics();
    const toast = useSplitBillToast();

    const totalAssigned = participants.reduce((sum, p) => sum + p.amount, 0);
    const remaining = transaction.amount - totalAssigned;
    const isValid = Math.abs(remaining) < 1 && participants.length >= 2;

    const handleAddParticipant = () => {
        if (!newName.trim()) return;
        haptics.tap();
        const updated = [...participants, { 
            id: Date.now().toString(), 
            name: newName, 
            amount: 0,
            phone: newPhone || undefined,
            whatsappNumber: newPhone || undefined
        }];
        
        if (splitMode === "equal") {
            const evenAmount = transaction.amount / updated.length;
            setParticipants(updated.map(p => ({ ...p, amount: evenAmount })));
        } else {
            setParticipants(updated);
        }
        setNewName("");
        setNewPhone("");
    };

    const handleRemoveParticipant = (id: string) => {
        if (id === "1") return; // Can't remove self
        haptics.tap();
        const updated = participants.filter(p => p.id !== id);
        
        if (splitMode === "equal") {
            const evenAmount = transaction.amount / updated.length;
            setParticipants(updated.map(p => ({ ...p, amount: evenAmount })));
        } else {
            // Redistribute the removed person's amount
            const removedAmount = participants.find(p => p.id === id)?.amount || 0;
            const additionalAmount = removedAmount / (updated.length);
            setParticipants(updated.map(p => ({ ...p, amount: p.amount + additionalAmount })));
        }
    };

    const handleAmountChange = (id: string, newAmount: number) => {
        setParticipants(participants.map(p => 
            p.id === id ? { ...p, amount: newAmount } : p
        ));
    };

    const handleModeChange = (mode: "equal" | "custom") => {
        haptics.tap();
        setSplitMode(mode);
        
        if (mode === "equal") {
            const evenAmount = transaction.amount / participants.length;
            setParticipants(participants.map(p => ({ ...p, amount: evenAmount })));
        }
    };

    const handleSkip = () => {
        haptics.tap();
        onClose();
        onSuccess?.();
    };

    const generateShareLink = (participant: Participant) => {
        if (!publicSplitId || !participant.paymentToken) return null;
        
        const shareUrl = `${window.location.origin}/split-bills/${publicSplitId}?token=${participant.paymentToken}`;
        const message = `Halo ${participant.name}! 👋\n\nKamu diminta untuk bayar bagianmu dalam split bill:\n\n📝 *${transaction.description}*\n💰 Bagian kamu: *${formatCurrency(participant.amount)}*\n\nYuk bayar sekarang: ${shareUrl}\n\n_Makasih!_`;
        
        const whatsappUrl = `https://wa.me/${participant.whatsappNumber || participant.phone || ''}?text=${encodeURIComponent(message)}`;
        return { shareUrl, message, whatsappUrl };
    };

    const handleShareToWhatsapp = (participant: Participant) => {
        haptics.tap();
        const shareData = generateShareLink(participant);
        if (!shareData) return;
        
        window.open(shareData.whatsappUrl, '_blank');
        toast.shareSuccess();
    };

    const handleCopyLink = (participant: Participant) => {
        haptics.tap();
        const shareData = generateShareLink(participant);
        if (!shareData?.shareUrl) return;
        
        navigator.clipboard.writeText(shareData.shareUrl).then(() => {
            toast.shareSuccess();
        }).catch(() => {
            toast.shareError();
        });
    };

    const handleSave = async () => {
        if (!isValid || !transaction.id) return;
        
        setIsSaving(true);
        haptics.medium();
        
        try {
            // Filter out "Saya" from participants (they don't owe themselves)
            const others = participants.filter(p => p.id !== "1");
            
            const response = await fetch("/api/split-bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: transaction.description,
                    paymentInstructions: "Konfirmasi pembayaran lewat link ini setelah transfer.",
                    items: [{
                        name: transaction.description,
                        price: transaction.amount,
                        quantity: 1,
                    }],
                    participants: others.map(p => ({
                        name: p.name,
                        amountOwed: p.amount,
                        phone: p.phone || p.whatsappNumber,
                    })),
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                setPublicSplitId(result.data.publicId);
                const tokensByName = new Map(
                    (result.data.participants || []).map((item: { name: string; paymentToken?: string }) => [item.name, item.paymentToken])
                );
                setParticipants(current => current.map(participant => ({
                    ...participant,
                    paymentToken: tokensByName.get(participant.name) || participant.paymentToken,
                })));
                setIsComplete(true);
                haptics.success();
                onSuccess?.();
            } else {
                throw new Error(result.error || "Failed to create split bill");
            }
        } catch (error) {
            logger.error("Error creating split bill", error);
            alert("Gagal membuat split bill. Coba lagi.");
        } finally {
            setIsSaving(false);
        }
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
                        {!isComplete ? (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
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

                                {/* Total Amount Display */}
                                <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-3xl text-center border border-sky-100 dark:border-sky-800">
                                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">Total Transaksi</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(transaction.amount)}</p>
                                </div>

                                {/* Split Mode Toggle */}
                                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        onClick={() => handleModeChange("equal")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                            splitMode === "equal"
                                                ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        <Divide size={16} />
                                        Split Rata
                                    </button>
                                    <button
                                        onClick={() => handleModeChange("custom")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                            splitMode === "custom"
                                                ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        <Sliders size={16} />
                                        Custom
                                    </button>
                                </div>

                                {/* Participants List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partisipan</p>
                                        <span className="text-xs text-slate-500">{participants.length} orang</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {participants.map(p => (
                                            <motion.div
                                                key={p.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-600">
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {splitMode === "custom" && p.id !== "1" ? (
                                                        <input
                                                            type="number"
                                                            value={Math.round(p.amount)}
                                                            onChange={(e) => handleAmountChange(p.id, parseFloat(e.target.value) || 0)}
                                                            className="w-24 px-3 py-1.5 text-right font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                                        />
                                                    ) : (
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {formatCurrency(Math.round(p.amount))}
                                                        </span>
                                                    )}
                                                    {p.id !== "1" && (
                                                        <button
                                                            onClick={() => handleRemoveParticipant(p.id)}
                                                            className="text-rose-500 hover:text-rose-600 p-1"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Add Participant Input */}
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="Nama teman..."
                                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 dark:text-white font-medium"
                                                onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                                            />
                                            <button
                                                onClick={handleAddParticipant}
                                                disabled={!newName.trim()}
                                                className="px-4 py-3 bg-sky-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-600 transition-colors"
                                            >
                                                <Users size={20} />
                                            </button>
                                        </div>
                                        <input
                                            type="tel"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value)}
                                            placeholder="No. WhatsApp (opsional) - contoh: 6281234567"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 dark:text-white text-sm"
                                            onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                                        />
                                    </div>

                                    {/* Remaining Amount Warning */}
                                    {splitMode === "custom" && Math.abs(remaining) >= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "p-3 rounded-xl text-sm font-bold text-center",
                                                remaining > 0
                                                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                                    : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                                            )}
                                        >
                                            {remaining > 0
                                                ? `Belum teralokasi: ${formatCurrency(remaining)}`
                                                : `Melebihi total: ${formatCurrency(Math.abs(remaining))}`
                                            }
                                        </motion.div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={!isValid || isSaving}
                                        className={cn(
                                            "w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                                            !isValid || isSaving
                                                ? "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                                : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
                                        )}
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle size={18} />
                                                Posting ke Tagihan ({participants.length - 1} orang)
                                            </>
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={handleSkip}
                                        disabled={isSaving}
                                        className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                    >
                                        Skip - Bayar Sendiri
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4"
                                >
                                    <Check size={40} strokeWidth={3} />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Berhasil!</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                    Tagihan hutang telah dibuat untuk {participants.length - 1} teman kamu
                                </p>
                                
                                {/* Share Section */}
                                <div className="pt-4 space-y-3">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Undang Peserta</p>
                                    <div className="space-y-2">
                                        {participants.filter(p => p.id !== "1").map((participant) => (
                                            <div key={participant.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-xs">
                                                        {participant.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{participant.name}</p>
                                                        <p className="text-xs text-slate-500">{formatCurrency(participant.amount)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopyLink(participant)}
                                                        aria-label={`Salin tautan pembayaran untuk ${participant.name}`}
                                                        className="p-2 text-slate-500 hover:text-sky-500 transition-colors dark:text-slate-400"
                                                        title="Salin tautan pembayaran"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleShareToWhatsapp(participant)}
                                                        className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors"
                                                        aria-label={`Bagikan tagihan ke WhatsApp untuk ${participant.name}`}
                                                        title="Bagikan via WhatsApp"
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex justify-center gap-3 pt-4">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">
                                        <MessageCircle size={16} /> WA Reminder
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-600 transition-colors">
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
