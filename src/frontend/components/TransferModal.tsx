"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Target, TrendingUp, Receipt, ArrowRightLeft, Loader2, ArrowLeftRight, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/frontend/lib/api-client";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { createLogger } from "@/lib/logger";

const logger = createLogger("TransferModal");

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface Destination {
    id: number;
    name: string;
    currentAmount?: number;
    targetAmount?: number;
    quantity?: number;
    currentPrice?: number;
    amount?: number;
    currentValue?: number;
    icon?: string;
    color?: string;
}

const ADMIN_FEE_PERCENTAGE = 0.02; // 2%

const transferTabs = [
    { id: "goal", label: "Tabungan", icon: Target },
    { id: "investment", label: "Investasi", icon: TrendingUp },
    { id: "bill", label: "Tagihan", icon: Receipt },
];

const withdrawTabs = [
    { id: "goal", label: "Tabungan", icon: Target },
    { id: "investment", label: "Investasi", icon: TrendingUp },
];

export function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
    const [mode, setMode] = useState<"transfer" | "withdraw">("transfer");
    const [activeTab, setActiveTab] = useState("goal");
    const [destinations, setDestinations] = useState<{
        goals: Destination[];
        investments: Destination[];
        bills: Destination[];
    }>({
        goals: [],
        investments: [],
        bills: [],
    });
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);
    const [targetAccountId, setTargetAccountId] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const tabs = mode === "transfer" ? transferTabs : withdrawTabs;
    const { accounts, isLoading: accountsLoading } = useAccountsData();

    useEffect(() => {
        if (isOpen) {
            setFetching(true);
            apiFetch(`/api/transfer?mode=${mode}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setDestinations(data.data);
                    }
                })
                .catch((err) => logger.error("Error fetching transfer data", err))
                .finally(() => setFetching(false));
        }
        setSelectedDestination(null);
        setAmount("");
        setDescription("");
        setSourceAccountId(null);
        setTargetAccountId(null);
    }, [isOpen, mode]);

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        
        if (!selectedDestination || !amount || parseFloat(amount) <= 0) return;

        const numAmount = parseFloat(amount);

        // Validation
        if (mode === "transfer") {
            const selectedAccount = accounts.find(a => a.id === sourceAccountId);
            if (!selectedAccount || numAmount > selectedAccount.balance) {
                setError("Saldo tidak cukup");
                return;
            }
        }

        if (mode === "transfer" && !sourceAccountId) {
            setError("Pilih akun sumber dana");
            return;
        }

        if (mode === "withdraw" && !targetAccountId) {
            setError("Pilih akun tujuan dana");
            return;
        }

        if (mode === "withdraw") {
            if (activeTab === "goal" && selectedDestination.currentAmount && numAmount > selectedDestination.currentAmount) {
                setError("Jumlah melebihi saldo tabungan");
                return;
            }
            if (activeTab === "investment" && selectedDestination.currentValue && numAmount > selectedDestination.currentValue) {
                setError("Jumlah melebihi nilai investasi");
                return;
            }
        }

        setLoading(true);
        try {
            const res = await apiFetch("/api/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: mode,
                    amount: numAmount,
                    type: activeTab,
                    id: selectedDestination.id,
                    description: description || undefined,
                    accountId: mode === "transfer" ? sourceAccountId : undefined,
                    targetAccountId: mode === "withdraw" ? targetAccountId : undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(data.error || "Operasi gagal");
            }
        } catch (error) {
            logger.error("Error during transfer", error);
            setError("Operasi gagal");
        } finally {
            setLoading(false);
        }
    };

    const getCurrentItems = () => {
        if (activeTab === "goal") return destinations?.goals || [];
        if (activeTab === "investment") return destinations?.investments || [];
        return destinations?.bills || [];
    };

    const getMaxAmount = () => {
        if (mode === "transfer") {
            const selectedAccount = accounts.find(a => a.id === sourceAccountId);
            return selectedAccount?.balance || 0;
        }
        if (!selectedDestination) return 0;
        if (activeTab === "goal") return selectedDestination.currentAmount || 0;
        if (activeTab === "investment") return selectedDestination.currentValue || 0;
        return 0;
    };

    const calculateFee = () => {
        if (!amount) return 0;
        return parseFloat(amount) * ADMIN_FEE_PERCENTAGE;
    };

    const calculateNetAmount = () => {
        if (!amount) return 0;
        return parseFloat(amount) - calculateFee();
    };

    const getBalanceLabel = () => {
        if (mode === "transfer") {
            const selectedAccount = accounts.find(a => a.id === sourceAccountId);
            return selectedAccount ? selectedAccount.name : "Sumber Dana";
        }
        if (activeTab === "goal") return "Saldo Tabungan";
        if (activeTab === "investment") return "Nilai Investasi";
        return "";
    };

    const getBalanceValue = () => {
        if (mode === "transfer") {
            const selectedAccount = accounts.find(a => a.id === sourceAccountId);
            return selectedAccount?.balance || 0;
        }
        if (!selectedDestination) return 0;
        if (activeTab === "goal") return selectedDestination.currentAmount || 0;
        if (activeTab === "investment") return selectedDestination.currentValue || 0;
        return 0;
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10005]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sticky Header */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {mode === "transfer" ? "Transfer Saldo" : "Withdraw Dana"}
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {/* Mode Toggle */}
                                <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        onClick={() => setMode("transfer")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                                            mode === "transfer"
                                                ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <ArrowRightLeft size={16} />
                                        Transfer
                                    </button>
                                    <button
                                        onClick={() => setMode("withdraw")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                                            mode === "withdraw"
                                                ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        <ArrowLeftRight size={16} />
                                        Withdraw
                                    </button>
                                </div>

                                {/* Balance Display */}
                                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <Wallet size={18} className="text-slate-500 dark:text-slate-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{getBalanceLabel()}:</span>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        mode === "transfer" ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400"
                                    )}>
                                        {formatCurrency(getBalanceValue())}
                                    </span>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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
                                                    ? mode === "transfer" ? "bg-sky-500 text-white" : "bg-emerald-500 text-white"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            )}
                                        >
                                            <tab.icon size={16} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Destination List */}
                                {fetching ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="animate-spin text-slate-400" size={24} />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {getCurrentItems().length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                                Tidak ada {activeTab === "goal" ? "tabungan" : activeTab === "investment" ? "investasi" : "tagihan"} {mode === "withdraw" ? "dengan saldo" : "aktif"}
                                            </p>
                                        ) : (
                                            getCurrentItems().map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setSelectedDestination(item)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left",
                                                        selectedDestination?.id === item.id
                                                            ? mode === "transfer"
                                                                ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30"
                                                                : "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                                                            : "border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-slate-900 dark:text-white truncate leading-tight mb-0.5">{item.name}</p>
                                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                                    {mode === "transfer" ? (
                                                                        activeTab === "goal" && item.targetAmount
                                                                            ? `${formatCurrency(item.currentAmount || 0)} / ${formatCurrency(item.targetAmount)}`
                                                                            : activeTab === "investment" && item.currentPrice
                                                                                ? `${item.quantity} unit @ ${formatCurrency(item.currentPrice)}`
                                                                                : item.amount
                                                                                    ? formatCurrency(item.amount)
                                                                                    : ""
                                                                    ) : (
                                                                        activeTab === "goal"
                                                                            ? `Saldo: ${formatCurrency(item.currentAmount || 0)}`
                                                                            : activeTab === "investment"
                                                                                ? `${item.quantity} unit = ${formatCurrency(item.currentValue || 0)}`
                                                                                : ""
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {mode === "transfer" && activeTab === "goal" && item.targetAmount && (
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
                                )}
                            </div>

                            {/* Sticky Detail Form at Bottom */}
                            {selectedDestination && !fetching && (
                                <div className="shrink-0 bg-white dark:bg-slate-900 p-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                                Jumlah {mode === "transfer" ? "Transfer" : "Withdraw"}
                                            </label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none text-lg font-semibold"
                                            />
                                            <button
                                                onClick={() => setAmount(getMaxAmount().toString())}
                                                className="text-xs text-slate-500 dark:text-slate-400 mt-1 hover:text-slate-700 dark:hover:text-slate-300"
                                            >
                                                Gunakan semua {mode === "transfer" ? "saldo" : "dana"}
                                            </button>
                                        </div>

                                        {/* Fee Display */}
                                        {amount && parseFloat(amount) > 0 && (
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Jumlah</span>
                                                    <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Biaya Admin (2%)</span>
                                                    <span className="font-medium text-amber-600">- {formatCurrency(calculateFee())}</span>
                                                </div>
                                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                                                    <span className="font-medium text-slate-700">
                                                        {mode === "transfer" ? "Diterima" : "Masuk ke Saldo"}
                                                    </span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        mode === "transfer" ? "text-sky-600" : "text-emerald-600"
                                                    )}>
                                                        {formatCurrency(calculateNetAmount())}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Account Selection - Sumber Dana / Tujuan Dana */}
                                        {(mode === "transfer" || mode === "withdraw") && (
                                            <section className="space-y-3">
                                                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                    {mode === "transfer" ? "Sumber Dana" : "Tujuan Dana"}
                                                </p>
                                                {accountsLoading ? (
                                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                                        {[1, 2, 3].map((i) => (
                                                            <div key={i} className="w-32 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                                        ))}
                                                    </div>
                                                ) : accounts.length === 0 ? (
                                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
                                                        Belum ada akun. Tambahkan akun terlebih dahulu.
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                        {accounts.map((acc) => {
                                                            const isSelected = mode === "transfer" ? sourceAccountId === acc.id : targetAccountId === acc.id;
                                                            return (
                                                                <button
                                                                    key={acc.id}
                                                                    onClick={() => mode === "transfer" ? setSourceAccountId(acc.id) : setTargetAccountId(acc.id)}
                                                                    className={`flex-shrink-0 w-36 p-3 rounded-xl border-2 transition-all text-left ${
                                                                        isSelected
                                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-400"
                                                                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 dark:hover:border-sky-600"
                                                                    }`}
                                                                >
                                                                    <p className={`font-bold text-sm ${isSelected ? "text-sky-600 dark:text-sky-400" : "text-slate-900 dark:text-white"}`}>
                                                                        {acc.name}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                                        {formatCurrency(acc.balance)}
                                                                    </p>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </section>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Keterangan (opsional)</label>
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder={activeTab === "bill" ? "Catatan pembayaran..." : `Catatan ${mode === "transfer" ? "transfer" : "withdraw"}...`}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none"
                                            />
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > getMaxAmount() || (mode === "transfer" && !sourceAccountId) || (mode === "withdraw" && !targetAccountId)}
                                            className={cn(
                                                "w-full py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2",
                                                loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > getMaxAmount() || (mode === "transfer" && !sourceAccountId) || (mode === "withdraw" && !targetAccountId)
                                                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                                                    : mode === "transfer" ? "bg-sky-500 hover:bg-sky-600" : "bg-emerald-500 hover:bg-emerald-600"
                                            )}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Memproses...
                                                </>
                                            ) : (
                                                <>
                                                    {mode === "transfer" ? "Transfer" : "Withdraw"} {amount ? formatCurrency(parseFloat(amount)) : ""}
                                                </>
                                            )}
                                        </button>

                                        {error && (
                                            <p className="text-xs text-red-500 dark:text-red-400 text-center">
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
