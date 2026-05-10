"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, Info, Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface MonthlyIncomeScreenProps {
    currency: string;
    monthlyIncome: number;
    onUpdate: (field: string, value: number) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function MonthlyIncomeScreen({
    currency,
    monthlyIncome,
    onUpdate,
    onNext,
    onPrev,
}: MonthlyIncomeScreenProps) {
    const [inputValue, setInputValue] = useState(monthlyIncome === 0 ? "" : monthlyIncome.toString());
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, "");
        setInputValue(value);

        const numValue = parseInt(value, 10) || 0;
        onUpdate("monthlyIncome", numValue);

        if (numValue > 1000000000000) {
            setError("Penghasilan terlalu besar");
        } else {
            setError("");
        }
    };

    const formatDisplayValue = (value: string) => {
        if (!value) return "";
        return parseInt(value, 10).toLocaleString("id-ID");
    };

    const handleNext = () => {
        if (error) return;

        const income = parseInt(inputValue, 10) || 0;
        onUpdate("monthlyIncome", income);
        onNext();
    };

    const presetAmounts = [
        { label: "1.000.000", value: 1000000 },
        { label: "2.500.000", value: 2500000 },
        { label: "5.000.000", value: 5000000 },
        { label: "7.500.000", value: 7500000 },
        { label: "10.000.000", value: 10000000 },
        { label: "15.000.000", value: 15000000 },
    ];

    return (
        <div className="flex-1 flex flex-col h-full">
            <header className="sticky top-0 z-50 w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4">
                <div className="pt-2 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onPrev}
                        className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                            Penghasilan Bulanan
                        </h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Dasar saran budget AI setiap bulan
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-1 px-6 py-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-8 -mb-8" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Banknote className="w-5 h-5 text-white/80" />
                                <span className="text-sm font-medium text-white/80">Estimasi Bulanan</span>
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

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Masukkan Penghasilan
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
                                "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none",
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
                        Nilai ini dipakai untuk membagi budget, bukan dicatat sebagai transaksi.
                    </p>
                </motion.div>

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
                                type="button"
                                key={preset.value}
                                onClick={() => {
                                    setInputValue(preset.value.toString());
                                    onUpdate("monthlyIncome", preset.value);
                                }}
                                className={cn(
                                    "py-3 px-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm relative overflow-hidden",
                                    parseInt(inputValue, 10) === preset.value
                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50"
                                )}
                            >
                                {parseInt(inputValue, 10) === preset.value && (
                                    <Check className="w-3 h-3 text-emerald-500 absolute top-1.5 right-1.5" />
                                )}
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="sticky bottom-0 px-6 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">
                <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleNext}
                    className="w-full btn-primary py-4 text-base font-semibold rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-sky-500/30"
                >
                    Lanjut ke Budget AI
                </motion.button>
            </div>
        </div>
    );
}
