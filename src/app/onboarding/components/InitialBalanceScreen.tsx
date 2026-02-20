"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, Info, Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

interface InitialBalanceScreenProps {
    currency: string;
    initialBalance: number;
    onUpdate: (field: string, value: number) => void;
    onFinish: () => void;
    onPrev: () => void;
}

export function InitialBalanceScreen({
    currency,
    initialBalance,
    onUpdate,
    onFinish,
    onPrev,
}: InitialBalanceScreenProps) {
    const [inputValue, setInputValue] = useState(initialBalance === 0 ? "" : initialBalance.toString());
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, "");
        setInputValue(value);

        const numValue = parseInt(value, 10) || 0;
        onUpdate("initialBalance", numValue);

        if (numValue > 1000000000000) {
            setError("Saldo terlalu besar");
        } else {
            setError("");
        }
    };

    const formatDisplayValue = (value: string) => {
        if (!value) return "";
        return parseInt(value, 10).toLocaleString("id-ID");
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        const balance = parseInt(inputValue, 10) || 0;
        onUpdate("initialBalance", balance);
        await onFinish();
        setIsSubmitting(false);
    };

    const presetAmounts = [
        { label: "0", value: 0 },
        { label: "100.000", value: 100000 },
        { label: "500.000", value: 500000 },
        { label: "1.000.000", value: 1000000 },
        { label: "5.000.000", value: 5000000 },
        { label: "10.000.000", value: 10000000 },
    ];

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4">
                <div className="pt-2 flex items-center gap-4">
                    <button
                        onClick={onPrev}
                        className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                            Saldo Awal
                        </h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Masukkan saldo awal Anda
                        </p>
                    </div>
                </div>
            </header>

            {/* Content ... (rest of the code stays mostly the same until the button) */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-sky-500 to-cyan-600 p-6 text-white shadow-xl shadow-sky-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-8 -mb-8" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-5 h-5 text-white/80" />
                                <span className="text-sm font-medium text-white/80">Saldo Awal</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-medium text-white/70">{currency === "IDR" ? "Rp" : currency}</span>
                                <span className="text-3xl font-bold tabular-nums">
                                    {inputValue ? formatDisplayValue(inputValue) : "0"}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Input Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        Masukkan Jumlah
                    </label>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                            {currency === "IDR" ? "Rp" : currency}
                        </span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatDisplayValue(inputValue)}
                            onChange={handleInputChange}
                            placeholder="0"
                            className={cn(
                                "w-full py-4 pl-14 pr-4 text-2xl font-bold rounded-2xl border-2 transition-all duration-200",
                                "bg-white dark:bg-slate-800",
                                "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none",
                                error ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                            )}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <Info className="w-4 h-4" />
                            {error}
                        </p>
                    )}

                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        Saldo ini akan dicatat sebagai pemasukan pertama Anda
                    </p>
                </motion.div>

                {/* Preset Amounts */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                >
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                        Pilih Jumlah Cepat
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {presetAmounts.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => {
                                    setInputValue(preset.value.toString());
                                    onUpdate("initialBalance", preset.value);
                                }}
                                className={cn(
                                    "py-3 px-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm relative overflow-hidden",
                                    parseInt(inputValue, 10) === preset.value
                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300"
                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50"
                                )}
                            >
                                {parseInt(inputValue, 10) === preset.value && (
                                    <Check className="w-3 h-3 text-sky-500 absolute top-1.5 right-1.5" />
                                )}
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/30"
                >
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                Tips
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Anda bisa memasukkan 0 jika tidak ingin mencatat saldo awal. Saldo bisa ditambahkan nanti melalui menu transaksi.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Finish Button */}
            <div className="sticky bottom-0 p-6 pb-8 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full btn-primary py-4 text-base font-semibold rounded-2xl flex items-center justify-center gap-2",
                        "hover:shadow-xl hover:shadow-sky-500/30",
                        isSubmitting && "opacity-80 cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        "Mulai Sekarang"
                    )}
                </motion.button>
            </div>
        </div>
    );
}