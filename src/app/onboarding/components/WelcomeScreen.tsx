"use client";

import { motion } from "framer-motion";
import { Wallet, Sparkles, TrendingUp, PiggyBank } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface WelcomeScreenProps {
    onStart: () => void;
    onSkip: () => void;
}

export function WelcomeScreen({ onStart, onSkip }: WelcomeScreenProps) {
    return (
        <div className="h-full flex flex-col">
            {/* Header with Skip Button */}
            <header className="sticky top-0 z-50 w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4">
                <div className="pt-2 flex items-center justify-end">
                    <button
                        onClick={onSkip}
                        className="text-sm font-medium text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        Lewati
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-6">
                {/* Logo Animation */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1 
                    }}
                    className="mb-8"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="w-28 h-28 mx-auto bg-gradient-to-br from-sky-500 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-sky-500/30"
                    >
                        <Wallet className="w-14 h-14 text-white" />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-black text-slate-900 dark:text-white text-center mb-3"
                >
                    Monev
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-500 dark:text-slate-400 text-center text-lg mb-10"
                >
                    Kelola Keuanganmu dengan Cerdas
                </motion.p>

                {/* Feature Highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-8 mb-8"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Advisor</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Analytics</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <PiggyBank className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Savings</span>
                    </div>
                </motion.div>
            </div>

            {/* CTA Button */}
            <div className="sticky bottom-0 p-6 pb-8 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={onStart}
                    className={cn(
                        "w-full btn-primary py-4 text-lg font-semibold rounded-2xl",
                        "hover:shadow-xl hover:shadow-sky-500/30 hover:scale-[1.02]",
                        "active:scale-95 transition-all duration-200"
                    )}
                >
                    Mulai Sekarang
                </motion.button>
            </div>
        </div>
    );
}
