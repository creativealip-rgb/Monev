"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, TrendingUp, PiggyBank } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface WelcomeScreenProps {
    onStart: () => void;
    onSkip: () => void;
}

export function WelcomeScreen({ onStart, onSkip }: WelcomeScreenProps) {
    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header with Skip Button */}
            <header className="sticky top-0 z-50 w-full px-6 py-3 flex justify-end">
                <button
                    onClick={onSkip}
                    className="min-h-11 px-3 text-sm font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                >
                    Lewati
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-10 pb-4">
                {/* Welcome Image */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.1
                    }}
                    className="mb-6"
                >
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Image
                            src="/images/onboarding-welcome.png"
                            alt="Welcome to Monev"
                            width={180}
                            height={180}
                            className="rounded-[32px] shadow-2xl shadow-sky-500/20"
                            priority
                        />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight"
                >
                    Monev
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-500 dark:text-slate-400 text-center text-base mb-10 font-medium"
                >
                    Kelola Keuanganmu dengan Cerdas
                </motion.p>

                {/* Feature Highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-6"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Advisor</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Analytics</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <PiggyBank className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Savings</span>
                    </div>
                </motion.div>
            </div>

            {/* CTA Button */}
            <div className="px-8 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={onStart}
                    className={cn(
                        "w-full btn-primary py-4 text-lg font-bold rounded-[22px]",
                        "shadow-xl shadow-sky-500/20 hover:shadow-sky-500/40",
                        "active:scale-95 transition-all duration-300"
                    )}
                >
                    Mulai Sekarang
                </motion.button>
            </div>
        </div>
    );
}
