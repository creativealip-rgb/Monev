"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, NotebookTabs, BarChart3, Plus, User } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useI18n } from "@/frontend/lib/i18n-context";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface BottomNavProps {
    onFabClick?: () => void;
}

export function BottomNav({ onFabClick }: BottomNavProps) {
    const pathname = usePathname();
    const [isFabPressed, setIsFabPressed] = useState(false);
    const { t } = useI18n();
    const haptics = useHaptics();

    const links = [
        { href: "/", label: t("nav.dashboard"), icon: Home },
        { href: "/transactions", label: t("nav.transactions"), icon: NotebookTabs },
        { href: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
        { href: "/profile", label: t("nav.profile"), icon: User },
    ];

    // Split links: first 2 on left, last 2 on right
    const leftLinks = links.slice(0, 2);
    const rightLinks = links.slice(2, 4);

    const handleFabClick = () => {
        setIsFabPressed(true);
        setTimeout(() => setIsFabPressed(false), 150);
        haptics.medium();
        onFabClick?.();
    };

    const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                onClick={() => haptics.tap()}
                className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full pb-1 select-none relative",
                    "transition-all duration-300"
                )}
            >
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            layoutId="nav-indicator"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute -top-0.5 w-6 h-1 bg-sky-500 rounded-full"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                </AnimatePresence>
                <div className={cn(
                    "p-1.5 rounded-xl transition-all duration-300",
                    isActive ? "bg-sky-50 dark:bg-sky-900/50" : "hover:bg-muted/50"
                )}>
                    <Icon
                        size={22}
                        className={cn(
                            "transition-all duration-300",
                            isActive ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground"
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                </div>
                <span className={cn(
                    "text-[10px] font-semibold tracking-tight transition-colors duration-300",
                    isActive ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground"
                )}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
            <div className="w-full max-w-[500px] mx-auto pointer-events-auto">
                <div className="glass dark:bg-slate-900/90 border-t border-white/40 dark:border-slate-700/50 pb-safe pt-1 px-2 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-end justify-between h-14 relative">
                        {leftLinks.map((link) => (
                            <NavLink key={link.href} {...link} />
                        ))}

                        <div className="flex-1 flex flex-col items-center justify-end pb-1 relative z-50">
                            <motion.button
                                onClick={handleFabClick}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.85 }}
                                animate={isFabPressed ? { scale: 0.85 } : { scale: 1 }}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-shadow",
                                    "bg-gradient-to-br from-sky-500 to-sky-600 text-white",
                                    "shadow-sky-500/40 hover:shadow-sky-500/60"
                                )}
                            >
                                <Plus size={24} strokeWidth={2.5} />
                            </motion.button>
                        </div>

                        {rightLinks.map((link) => (
                            <NavLink key={link.href} {...link} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
