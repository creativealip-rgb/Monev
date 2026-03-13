"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { FeatureItem } from "@/frontend/components/FeatureItem";
import { canAccessAnalytics, canAccessInvestments } from "@/lib/tier-gate";
import { useI18n } from "@/lib/i18n";
import { Sparkles, PieChart, PiggyBank, Receipt, TrendingUp, Wallet, Zap, Crown, Users, Repeat } from "lucide-react";
import type { FeaturesWidgetProps } from "../../types";

const mainFeatures = [
    { label: "features.monev_ai", icon: <Sparkles size={24} />, color: "purple", href: "/chat" },
    { label: "features.analytics", icon: <PieChart size={24} />, color: "sky", href: "/analytics" },
    { label: "features.budgets", icon: <Wallet size={24} />, color: "orange", href: "/budgets" },
    { label: "features.savings", icon: <PiggyBank size={24} />, color: "emerald", href: "/savings" },
    { label: "features.simulations", icon: <Zap size={24} />, color: "purple", href: "/simulations" },
    { label: "features.bills", icon: <Receipt size={24} />, color: "rose", href: "/bills" },
    { label: "features.investments", icon: <TrendingUp size={24} />, color: "amber", href: "/investments" },
    { label: "features.debts", icon: <Users size={24} />, color: "rose", href: "/debts" },
    { label: "features.recurring", icon: <Repeat size={24} />, color: "emerald", href: "/recurring" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export function FeaturesWidget({ userTier }: FeaturesWidgetProps) {
    const { t } = useI18n();

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="px-6 mb-8"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Fitur Andalan</h2>
                <Link href="/fitur" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1">
                    {t("dashboard.viewAll")}
                    <ChevronRight size={14} />
                </Link>
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-y-8 gap-x-4 justify-items-center"
            >
                {mainFeatures.map((feature) => {
                    const isLocked =
                        (feature.label === "features.analytics" && !canAccessAnalytics(userTier)) ||
                        (feature.label === "features.investments" && !canAccessInvestments(userTier));

                    return (
                        <Link
                            key={feature.label}
                            href={feature.href}
                            className="relative group"
                        >
                            <FeatureItem
                                label={t(feature.label)}
                                icon={feature.icon}
                                color={feature.color}
                            />
                            {isLocked && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                    <Lock size={10} className="text-slate-400" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </motion.div>
        </motion.section>
    );
}
