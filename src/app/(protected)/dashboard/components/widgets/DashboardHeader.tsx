"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, Sparkles, Crown, Zap } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
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
    onNotificationsClick,
}: DashboardHeaderProps) {
    const tierStyle = TIER_STYLES[userTier] || TIER_STYLES.starter;
    const TierIcon = tierStyle.icon;

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (mounted) {
            fetchUnreadCount();
        }
    }, [mounted]);

    async function fetchUnreadCount() {
        try {
            const response = await apiFetch("/api/notifications");
            if (response.ok) {
                const result = await response.json();
                const unread = result.data?.filter((n: any) => !n.isRead).length || 0;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }

    return (
        <header className="sticky top-0 z-[100] w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-sky-100/50 dark:border-slate-800/50">
            <div className="flex items-center justify-between gap-3">
                <Link href="/profile" className="min-w-0 flex flex-1 items-center gap-2.5 group active:scale-95 transition-transform">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 p-[2px] shadow-md shadow-sky-500/20 sm:h-10 sm:w-10"
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
                                <div className="w-full h-full bg-gradient-to-br from-sky-100 to-cyan-50 dark:from-sky-900 dark:to-cyan-900 flex items-center justify-center text-sm font-bold text-sky-700 dark:text-sky-300 sm:text-base">
                                    {userName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </motion.div>
                    <div className="min-w-0 flex flex-col">
                        <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-[11px]">{formattedDate}</p>
                        <h1 className="truncate text-sm font-bold text-foreground tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors sm:text-base">
                            {!userName ? (
                                <span className="inline-block w-24 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md align-middle" />
                            ) : (
                                `Hello, ${userName.split(" ")[0]}! 👋`
                            )}
                        </h1>
                    </div>
                </Link>

                <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                        href="/fitur/upgrade"
                        className={cn(
                            "hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-tight sm:inline-flex",
                            tierStyle.bg,
                            tierStyle.border,
                            tierStyle.color
                        )}
                    >
                        <TierIcon size={10} />
                        {tierStyle.label}
                        <ChevronRight size={10} />
                    </Link>

                    {streak && streak.current > 0 && (
                        <div className="hidden items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-black text-orange-600 dark:border-orange-900/30 dark:bg-orange-900/10 dark:text-orange-400 md:flex" title={`Longest: ${streak.longest} hari`}>
                            <span>🔥</span>
                            {streak.current} Hari
                        </div>
                    )}

                    <motion.button
                        type="button"
                        aria-label="Buka notifikasi"
                        onClick={() => {
                            onNotificationsClick?.();
                            setUnreadCount(0); // Optimistic clear
                        }}
                        whileHover={{ scale: 1.08, rotate: 8 }}
                        whileTap={{ scale: 0.92 }}
                        className="relative h-9 w-9 rounded-full glass-card flex items-center justify-center text-muted-foreground dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-700 transition-all"
                    >
                        <Bell size={17} strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
                        )}
                    </motion.button>
                </div>
            </div>
        </header>
    );
}
