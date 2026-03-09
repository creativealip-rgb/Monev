"use client";

import { motion } from "framer-motion";
import { Wallet, Plus, Banknote, Landmark, Smartphone } from "lucide-react";
import { useI18n } from "@/frontend/lib/i18n-context";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";

interface OnboardingCardProps {
    show: boolean;
}

export function OnboardingCard({ show }: OnboardingCardProps) {
    const { t } = useI18n();
    const haptics = useHaptics();

    if (!show) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 mb-6"
        >
            <div className={cn(
                "p-6 rounded-3xl border-2 border-dashed",
                "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-900",
                "border-sky-200 dark:border-slate-700"
            )}>
                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                        <Wallet size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {t("onboarding.setupYourAccounts")}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t("onboarding.setupYourAccountsSubtitle")}
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                    {t("onboarding.setupDescription")}
                </p>

                {/* Account Type Examples */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Landmark size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center">
                            {t("onboarding.examples.bank")}
                        </span>
                    </motion.div>
                    
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Smartphone size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center">
                            {t("onboarding.examples.emoney")}
                        </span>
                    </motion.div>
                    
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Banknote size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center">
                            {t("onboarding.examples.cash")}
                        </span>
                    </motion.div>
                </div>

                {/* CTA Button */}
                <Link href="/balances" onClick={() => haptics.medium()}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2",
                            "bg-gradient-to-r from-sky-400 to-blue-500 text-white",
                            "shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40",
                            "transition-all duration-200"
                        )}
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        {t("onboarding.addFirstAccount")}
                    </motion.button>
                </Link>

                {/* Quick Stats Preview */}
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
                        {t("onboarding.afterSetup")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    {t("onboarding.seeTotalWealth")}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {t("onboarding.seeTotalWealthDesc")}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-sky-500" />
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    {t("onboarding.trackCashflow")}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {t("onboarding.trackCashflowDesc")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
