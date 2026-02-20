"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bell, Lock, Globe, Wallet, Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { CURRENCIES, LANGUAGES } from "../types";

interface QuickSetupProps {
    currency: string;
    language: string;
    pin: string;
    notifications: boolean;
    onUpdate: (field: string, value: string | boolean) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function QuickSetup({
    currency,
    language,
    pin,
    notifications,
    onUpdate,
    onNext,
    onPrev,
}: QuickSetupProps) {
    return (
        <div className="h-full flex flex-col">
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
                            Personalisasi
                        </h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Sesuaikan pengalaman Anda
                        </p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
                {/* Currency Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Mata Uang
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                onClick={() => onUpdate("currency", c.code)}
                                className={cn(
                                    "py-4 px-3 rounded-2xl border-2 transition-all duration-200 font-medium relative overflow-hidden",
                                    currency === c.code
                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300"
                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50"
                                )}
                            >
                                {currency === c.code && (
                                    <div className="absolute top-2 right-2">
                                        <Check className="w-4 h-4 text-sky-500" />
                                    </div>
                                )}
                                <span className="text-lg font-bold">{c.code}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Language Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        Bahasa
                    </label>
                    <div className="flex gap-3">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => onUpdate("language", lang.code)}
                                className={cn(
                                    "flex-1 py-4 px-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden",
                                    language === lang.code
                                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300"
                                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50"
                                )}
                            >
                                {language === lang.code && (
                                    <div className="absolute top-2 right-2">
                                        <Check className="w-4 h-4 text-sky-500" />
                                    </div>
                                )}
                                <span className="font-semibold">{lang.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* PIN Security (Optional) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        PIN Keamanan (Opsional)
                    </label>
                    <div className="flex gap-3 justify-center">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <input
                                key={index}
                                type="password"
                                maxLength={1}
                                value={pin[index] || ""}
                                onChange={(e) => {
                                    const newPin = pin.split("");
                                    newPin[index] = e.target.value;
                                    onUpdate("pin", newPin.join("").slice(0, 6));
                                    if (e.target.value && index < 5) {
                                        const inputs = document.querySelectorAll('.pin-input');
                                        (inputs[index + 1] as HTMLInputElement)?.focus();
                                    }
                                }}
                                className={cn(
                                    "pin-input w-12 h-14 text-center text-xl font-bold rounded-xl border-2",
                                    "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all",
                                    "bg-white dark:bg-slate-800",
                                    pin[index] ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" : "border-slate-200 dark:border-slate-700"
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                        PIN untuk mengamankan aplikasi
                    </p>
                </motion.div>

                {/* Notifications Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between p-5 glass-card rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                <Bell className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">Notifikasi</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                    Pengingat harian
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onUpdate("notifications", !notifications)}
                            className={cn(
                                "w-14 h-7 rounded-full transition-colors relative",
                                notifications ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
                            )}
                        >
                            <motion.div
                                animate={{ x: notifications ? 28 : 2 }}
                                className="w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm"
                            />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Continue Button */}
            <div className="sticky bottom-0 p-6 pb-8 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={onNext}
                    className={cn(
                        "w-full btn-primary py-4 text-base font-semibold rounded-2xl",
                        "hover:shadow-xl hover:shadow-sky-500/30"
                    )}
                >
                    Lanjutkan
                </motion.button>
            </div>
        </div>
    );
}
