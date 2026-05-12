"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { FeatureItem } from "@/frontend/components/FeatureItem";
import { canAccessAnalytics, canAccessInvestments } from "@/lib/tier-gate";
import { useI18n } from "@/lib/i18n";
import { advancedFeatureMenu } from "@/frontend/lib/navigation-menu";
import type { FeaturesWidgetProps } from "../../types";

const featureColors = ["purple", "sky", "orange", "emerald", "rose", "amber"];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
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
                <div>
                    <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Advanced Tools</h2>
                    <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Budget, laporan, AI, dan fitur finansial lengkap</p>
                </div>
                <Link href="/fitur" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1">
                    {t("dashboard.viewAll")}
                    <ChevronRight size={14} />
                </Link>
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-y-8 gap-x-4 justify-items-center"
            >
                {advancedFeatureMenu.map((feature, index) => {
                    const isLocked =
                        (feature.key === "analytics" && !canAccessAnalytics(userTier)) ||
                        (feature.key === "investments" && !canAccessInvestments(userTier));
                    const Icon = feature.icon;

                    return (
                        <div key={feature.key} className="relative group">
                            <Link href={feature.href}>
                                <FeatureItem
                                    label={feature.label}
                                    icon={<Icon size={24} />}
                                    color={featureColors[index % featureColors.length]}
                                />
                                {isLocked && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                        <Lock size={10} className="text-slate-400" />
                                    </div>
                                )}
                            </Link>
                        </div>
                    );
                })}
            </motion.div>
        </motion.section>
    );
}
