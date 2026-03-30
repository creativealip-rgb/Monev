"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useToast } from "@/frontend/components/UI";

export function CurrencySelector({ variant = "default" }: { variant?: "default" | "minimal" }) {
    const [currency, setCurrency] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("monev_currency") || "IDR";
        }
        return "IDR";
    });
    const haptics = useHaptics();
    const toast = useToast();

    const currencies = [
        { id: "IDR", label: "Rupiah", flag: "🇮🇩", symbol: "Rp" },
        { id: "USD", label: "Dollar", flag: "🇺🇸", symbol: "$" },
        { id: "EUR", label: "Euro", flag: "🇪🇺", symbol: "€" },
        { id: "SGD", label: "Singapura", flag: "🇸🇬", symbol: "S$" },
        { id: "MYR", label: "Ringgit", flag: "🇲🇾", symbol: "RM" },
    ];

    const handleChange = (newCurrency: string) => {
        setCurrency(newCurrency);
        localStorage.setItem("monev_currency", newCurrency);
        window.dispatchEvent(new Event("storage"));
        haptics.success();
        toast.success("Berhasil", `Mata uang diubah ke ${currencies.find(c => c.id === newCurrency)?.label}`);
    };

    if (variant === "minimal") {
        return (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                {currencies.slice(0, 3).map((curr) => (
                    <button
                        key={curr.id}
                        onClick={() => handleChange(curr.id)}
                        className={cn(
                            "relative px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                            currency === curr.id
                                ? "text-white"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        {currency === curr.id && (
                            <motion.div
                                layoutId="curr-active-min"
                                className="absolute inset-0 bg-emerald-500 rounded-full z-0"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{curr.id}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-full border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto scrollbar-hide">
            {currencies.map((curr) => (
                <button
                    key={curr.id}
                    onClick={() => handleChange(curr.id)}
                    className={cn(
                        "relative flex items-center gap-1.5 py-2.5 px-3 rounded-xl transition-all whitespace-nowrap flex-shrink-0",
                        currency === curr.id
                            ? "shadow-sm"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                >
                    {currency === curr.id && (
                        <motion.div
                            layoutId="curr-active"
                            className="absolute inset-0 bg-emerald-500 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}

                    <span className="relative z-10 text-base leading-none">{curr.flag}</span>
                    <span className={cn(
                        "text-[11px] font-bold transition-colors leading-none",
                        currency === curr.id ? "text-white" : "text-slate-700 dark:text-slate-300"
                    )}>
                        {curr.id}
                    </span>
                </button>
            ))}
        </div>
    );
}
