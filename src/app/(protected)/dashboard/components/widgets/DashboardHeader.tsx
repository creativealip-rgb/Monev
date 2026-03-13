"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, Sparkles, Crown, Zap } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { TierStyle, DashboardHeaderProps } from "../../types";

const TIER_STYLES: Record<string, TierStyle> = {
    starter: { label: "Starter", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: Zap },
    pro: { label: "Pro", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-100 dark:border-sky-800", icon: Sparkles },
    sultan: { label: "Sultan", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800", icon: Crown },
};

export function DashboardHeader({
    userName,
    userImage,
    userTier,
    streak,
    formattedDate,
    mounted,
}: DashboardHeaderProps) {
    const tierStyle = TIER_STYLES[userTier];
    const TierIcon = tierStyle.icon;

    return (
        <header className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50">
            <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="flex items-center gap-3 group active:scale-95 transition-transform">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 p-[2px] shadow-lg shadow-sky-500/20"
                        >
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                {userImage ? (
                                    <Image
                                        src={userImage.split("?")[0]}
                                        alt={userName || "User"}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                ) : !userName ? (
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-sky-100 to-cyan-50 dark:from-sky-900 dark:to-cyan-900 flex items-center justify-center text-base font-bold text-sky-700 dark:text-sky-300">
                                        {userName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                        <div className="flex flex-col">
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{formattedDate}</p>
                            <h1 className="text-sm font-bold text-foreground tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                {!userName ? (
                                    <span className="inline-block w-24 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md align-middle" />
                                ) : (
                                    `Hello, ${userName.split(" ")[0]}! 👋`
                                )}
                            </h1>
                        </div>
                    </Link>

                    <div className="flex items-center gap-1.5 pt-4">
                        <div className={cn(
                            "px-1.5 py-0.5 rounded-md border flex items-center gap-1",
                            tierStyle.bg,
                            tierStyle.border
                        )}>
                            <TierIcon size={8} className={tierStyle.color} />
                            <span className={cn("text-[8px] font-black uppercase tracking-tighter", tierStyle.color)}>
                                {tierStyle.label}
                            </span>
                        </div>

                        {streak && streak.current > 0 && (
                            <div className="px-1.5 py-0.5 rounded-md border border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-900/10 flex items-center gap-1">
                                <span className="text-[8px]">🔥</span>
                                <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter" title={`Longest: ${streak.longest} hari`}>
                                    {streak.current} Hari
                                </span>
                            </div>
                        )}

                        <Link
                            href="/fitur/upgrade"
                            className="text-[8px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1.5"
                        >
                            Ganti Paket <ChevronRight size={8} />
                        </Link>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-700 hover:shadow-xl hover:shadow-sky-200/50 dark:hover:shadow-sky-900/50 transition-all"
                >
                    <Bell size={18} strokeWidth={2.5} />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white animate-pulse" />
                </motion.button>
            </div>
        </header>
    );
}
