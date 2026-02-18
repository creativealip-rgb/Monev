"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Target, TrendingUp, Receipt, ArrowRightLeft, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { useEffect, useState } from "react";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    currentBalance: number;
}

interface Destination {
    id: number;
    name: string;
    currentAmount?: number;
    targetAmount?: number;
    quantity?: number;
    currentPrice?: number;
    amount?: number;
}

const tabs = [
    { id: "goal", label: "Tabungan", icon: Target },
    { id: "investment", label: "Investasi", icon: TrendingUp },
    { id: "bill", label: "Tagihan", icon: Receipt },
];

export function TransferModal({ isOpen, onClose, onSuccess, currentBalance }: TransferModalProps) {
    const [activeTab, setActiveTab] = useState("goal");
    const [destinations, setDestinations] = useState<{ goals: Destination[]; investments: Destination[]; bills: Destination[] }>({
        goals: [],
        investments: [],
        bills: [],
    });
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFetching(true);
            fetch("/api/transfer")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setDestinations(data.data);
                    }
                })
                .catch(console.error)
                .finally(() => setFetching(false));
        }
        setSelectedDestination(null);
        setAmount("");
        setDescription("");
    }, [isOpen]);

    const handleTransfer = async () => {
        if (!selectedDestination || !amount || parseFloat(amount) <= 0) return;

        setLoading(true);
        try {
            const res = await fetch("/api/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    destinationType: activeTab,
                    destinationId: selectedDestination.id,
                    description: description || undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                onSuccess?.();
                onClose();
            } else {
                alert(data.error || "Transfer failed");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            alert("Transfer failed");
        } finally {
            setLoading(false);
        }
    };

    const getCurrentItems = () => {
        if (activeTab === "goal") return destinations.goals;
        if (activeTab === "investment") return destinations.investments;
        return destinations.bills;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[10005] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transfer Saldo</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <ArrowRightLeft size={18} className="text-slate-500 dark:text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Saldo Aktif:</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(currentBalance)}</span>
                    </div>

                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 sticky top-0 bg-white dark:bg-slate-900 z-10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSelectedDestination(null);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    activeTab === tab.id
                                        ? "bg-sky-500 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {fetching ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto flex-1">
                                {getCurrentItems().length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Tidak ada {activeTab === "goal" ? "tabungan" : activeTab === "investment" ? "investasi" : "tagihan"} aktif</p>
                                ) : (
                                    getCurrentItems().map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedDestination(item)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left",
                                                selectedDestination?.id === item.id
                                                    ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30"
                                                    : "border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                            )}
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {activeTab === "goal" && item.targetAmount
                                                        ? `${formatCurrency(item.currentAmount || 0)} / ${formatCurrency(item.targetAmount)}`
                                                        : activeTab === "investment" && item.currentPrice
                                                        ? `${item.quantity} unit @ ${formatCurrency(item.currentPrice)}`
                                                        : item.amount
                                                        ? formatCurrency(item.amount)
                                                        : ""}
                                                </p>
                                            </div>
                                            {activeTab === "goal" && item.targetAmount && (
                                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${Math.min(((item.currentAmount || 0) / item.targetAmount) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            {selectedDestination && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Jumlah Transfer</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none text-lg font-semibold"
                                        />
                                        <button
                                            onClick={() => setAmount(currentBalance.toString())}
                                            className="text-xs text-slate-500 dark:text-slate-400 mt-1 hover:text-slate-700 dark:hover:text-slate-300"
                                        >
                                            Gunakan semua saldo
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Keterangan (opsional)</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={activeTab === "bill" ? "Catatan pembayaran..." : "Catatan transfer..."}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleTransfer}
                                        disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance}
                                        className={cn(
                                            "w-full py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2",
                                            loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance
                                                ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                                                : "bg-sky-500 hover:bg-sky-600"
                                        )}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                Transfer {amount ? formatCurrency(parseFloat(amount)) : ""}
                                            </>
                                        )}
                                    </button>

                                    {amount && parseFloat(amount) > currentBalance && (
                                        <p className="text-xs text-red-500 dark:text-red-400 text-center">Saldo tidak cukup</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
