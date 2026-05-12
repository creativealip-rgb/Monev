"use client";

import { motion } from "framer-motion";
import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { type UserTier, isTierSufficient, TIER_CONFIGS } from "@/lib/tier-gate";

interface TierGateOverlayProps {
    requiredTier: UserTier;
    currentTier: UserTier;
    featureName: string;
    /** If true, renders as inline banner instead of full overlay */
    inline?: boolean;
}

const TIER_ICONS: Record<UserTier, typeof Lock> = {
    starter: Lock,
    pro: Sparkles,
    sultan: Crown,
    benefactor: Sparkles,
};

const TIER_COLORS: Record<UserTier, { bg: string; text: string; border: string; button: string }> = {
    starter: {
        bg: "bg-slate-50 dark:bg-slate-900",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-200 dark:border-slate-800",
        button: "bg-slate-900 dark:bg-white text-white dark:text-slate-900",
    },
    pro: {
        bg: "bg-sky-50/80 dark:bg-sky-900/20",
        text: "text-sky-700 dark:text-sky-300",
        border: "border-sky-200/50 dark:border-sky-800/50",
        button: "bg-sky-500 hover:bg-sky-600 text-white",
    },
    sultan: {
        bg: "bg-amber-50/80 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200/50 dark:border-amber-800/50",
        button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
    },
    benefactor: {
        bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/50 dark:border-emerald-800/50",
        button: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
    },
};

/**
 * Full-page overlay that blocks access to tier-locked features.
 * Shows a blurred backdrop with upgrade CTA.
 */
export function TierGateOverlay({ requiredTier, currentTier, featureName, inline }: TierGateOverlayProps) {
    if (isTierSufficient(currentTier, requiredTier)) return null;

    const Icon = TIER_ICONS[requiredTier];
    const colors = TIER_COLORS[requiredTier];
    const config = TIER_CONFIGS[requiredTier];

    if (inline) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}
            >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                    <Lock size={18} className={colors.text} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${colors.text}`}>
                        Perlu upgrade ke {config.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {featureName} tersedia di tier {config.name}
                    </p>
                </div>
                <Link
                    href="/fitur/upgrade"
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${colors.button} transition-all active:scale-95 shrink-0`}
                >
                    Upgrade
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 flex items-center justify-center backdrop-blur-md bg-white/60 dark:bg-slate-950/70"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", damping: 20 }}
                className="text-center px-8 max-w-sm"
            >
                <div className={`w-20 h-20 rounded-3xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <Icon size={32} className={colors.text} />
                </div>

                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    Fitur {config.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    <strong>{featureName}</strong> hanya tersedia untuk tier{" "}
                    <span className={`font-bold ${colors.text}`}>{config.name}</span> ke atas.
                </p>

                <Link
                    href="/fitur/upgrade"
                    className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold ${colors.button} shadow-lg transition-all active:scale-95`}
                >
                    Upgrade ke {config.name}
                    <ArrowRight size={16} />
                </Link>

                <p className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Mulai dari Rp 29k/bulan
                </p>
            </motion.div>
        </motion.div>
    );
}

/**
 * Inline limit warning banner shown when approaching or reaching a limit.
 */
export function TierLimitBanner({
    currentCount,
    maxCount,
    itemName,
    tier,
}: {
    currentCount: number;
    maxCount: number | null;
    itemName: string;
    tier: UserTier;
}) {
    if (maxCount === null) return null; // unlimited
    if (currentCount < maxCount) return null; // still within limit

    const nextTier = tier === "starter" ? "pro" : "sultan";
    const colors = TIER_COLORS[nextTier];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-3 rounded-2xl border ${colors.bg} ${colors.border} mb-4`}
        >
            <Lock size={14} className={colors.text} />
            <p className={`text-[11px] font-semibold ${colors.text} flex-1`}>
                Batas {maxCount} {itemName} tercapai
            </p>
            <Link
                href="/fitur/upgrade"
                className={`px-3 py-1 rounded-xl text-[10px] font-bold ${colors.button} transition-all active:scale-95`}
            >
                Upgrade
            </Link>
        </motion.div>
    );
}
