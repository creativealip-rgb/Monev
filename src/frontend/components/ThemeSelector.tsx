"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useHeroTheme, THEME_CONFIGS, type ThemeColor } from "@/frontend/lib/hero-theme";
import { useState } from "react";

export function ThemeSelector() {
    const { theme, setTheme } = useHeroTheme();
    const [isOpen, setIsOpen] = useState(false);

    const themes: ThemeColor[] = ["navy", "royal", "sky"];

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-white/10 backdrop-blur-md border border-white/20",
                    "hover:bg-white/20 transition-all"
                )}
            >
                <Palette size={14} className="text-white/80" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute top-full right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[140px]"
                        >
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                                Pilih Tema
                            </p>
                            {themes.map((t) => {
                                const config = THEME_CONFIGS[t];
                                const isActive = theme === t;
                                return (
                                    <motion.button
                                        key={t}
                                        onClick={() => {
                                            setTheme(t);
                                            setIsOpen(false);
                                        }}
                                        whileHover={{ backgroundColor: "rgba(241, 245, 249, 1)" }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                            isActive && "bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full bg-gradient-to-br",
                                            config.gradient
                                        )} />
                                        <span className="text-sm font-medium text-slate-700 flex-1 text-left">
                                            {config.name}
                                        </span>
                                        {isActive && (
                                            <Check size={14} className="text-blue-600" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
