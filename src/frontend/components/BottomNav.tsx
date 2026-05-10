"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, NotebookTabs, Wallet, Plus, User } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSecurity } from "@/components/SecurityProvider";
import { createLogger } from "@/lib/logger";

const logger = createLogger("BottomNav");

interface BottomNavProps {
    onFabClick?: () => void;
    hideOnFocus?: boolean;
    portal?: boolean;
}

export function BottomNav({ onFabClick, hideOnFocus = true, portal = false }: BottomNavProps) {
    const pathname = usePathname();
    const [isFabPressed, setIsFabPressed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const { t } = useI18n();
    const haptics = useHaptics();
    const { toggleStealth } = useSecurity();
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const focusableSelector = "input, textarea, select, [contenteditable='true']";
        const getViewportKeyboardState = () => {
            if (!window.visualViewport) return false;
            return window.innerHeight - window.visualViewport.height > 120;
        };
        const updateKeyboardState = () => {
            const focusedInput = hideOnFocus && (document.activeElement?.matches(focusableSelector) ?? false);
            const viewportKeyboardOpen = getViewportKeyboardState();
            setIsKeyboardOpen(focusedInput || viewportKeyboardOpen);
            document.documentElement.classList.toggle("keyboard-open", focusedInput || viewportKeyboardOpen);
        };

        window.visualViewport?.addEventListener("resize", updateKeyboardState);
        window.visualViewport?.addEventListener("scroll", updateKeyboardState);
        document.addEventListener("focusin", updateKeyboardState);
        document.addEventListener("focusout", updateKeyboardState);
        updateKeyboardState();

        return () => {
            window.visualViewport?.removeEventListener("resize", updateKeyboardState);
            window.visualViewport?.removeEventListener("scroll", updateKeyboardState);
            document.removeEventListener("focusin", updateKeyboardState);
            document.removeEventListener("focusout", updateKeyboardState);
            document.documentElement.classList.remove("keyboard-open");
        };
    }, [hideOnFocus]);

    const links = [
        { href: "/dashboard", label: t("nav.dashboard"), icon: Home },
        { href: "/transactions", label: t("nav.transactions"), icon: NotebookTabs },
        { href: "/saldo", label: t("nav.balances"), icon: Wallet },
        { href: "/profile", label: t("nav.profile"), icon: User },
    ];

    const leftLinks = links.slice(0, 2);
    const rightLinks = links.slice(2, 4);

    const handleFabClick = () => {
        setIsFabPressed(true);
        setTimeout(() => setIsFabPressed(false), 150);
        haptics.medium();
        onFabClick?.();
    };

    const handlePointerDown = () => {
        const timer = setTimeout(() => {
            haptics.success();
            toggleStealth();
            setLongPressTimer(null);
        }, 800);
        setLongPressTimer(timer);
    };

    const handlePointerUp = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const router = useRouter();
    const isApk = process.env.NEXT_PUBLIC_IS_APK === "true";

    const handleNavClick = (href: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        logger.debug("Navigating to:", href);
        haptics.tap();
        
        // In APK build, we need trailing slashes for static export folders to work
        const finalHref = isApk && !href.endsWith('/') ? `${href}/` : href;
        router.push(finalHref);
    };

    if (!mounted || isKeyboardOpen) return null;

    const navContent = (
        <>
            <div className="fixed inset-x-0 bottom-0 z-[99998] h-[calc(7rem+env(safe-area-inset-bottom))] pointer-events-none bg-gradient-to-t from-sky-50 via-sky-50/92 to-sky-50/0 dark:from-slate-950 dark:via-slate-950/92 dark:to-slate-950/0" />
            <div
                className="fixed inset-x-3 z-[99999] pointer-events-none bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
            >
                <div className="relative w-full max-w-[460px] mx-auto">
                <div
                    className="border border-slate-200 bg-white px-2.5 py-1.5 shadow-[0_16px_45px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 rounded-[28px] pointer-events-auto"
                >
                    <div className="flex items-end justify-between h-12 relative">
                        {leftLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => handleNavClick(link.href, e)}
                                    onMouseDown={() => {
                                        logger.debug("MouseDown on:", link.href);
                                        haptics.tap();
                                    }}
                                    aria-label={link.label}
                                    aria-current={isActive ? "page" : undefined}
                                    className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full select-none relative z-50 pointer-events-auto rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
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
                                        "p-1 rounded-xl transition-all duration-300",
                                        isActive ? "bg-sky-50 dark:bg-sky-900/50" : "hover:bg-muted/50"
                                    )}>
                                        <Icon
                                            size={20}
                                            className={cn(
                                                "transition-all duration-300",
                                                isActive ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground"
                                            )}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-semibold tracking-tight transition-colors duration-300",
                                        isActive ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground"
                                    )}>
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}

                        <div className="flex-1 flex flex-col items-center justify-center relative z-50">
                            <motion.button
                                onClick={handleFabClick}
                                onPointerDown={handlePointerDown}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                aria-label={t("transactions.add")}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.85 }}
                                animate={isFabPressed ? { scale: 0.85 } : { scale: 1 }}
                                className={cn(
                                    "w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-shadow",
                                    "bg-gradient-to-br from-sky-500 to-sky-600 text-white",
                                    "shadow-sky-500/40 hover:shadow-sky-500/60",
                                    "pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                                )}
                            >
                                <Plus size={22} strokeWidth={2.5} />
                            </motion.button>
                        </div>

                        {rightLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => handleNavClick(link.href, e)}
                                    onMouseDown={() => {
                                        logger.debug("MouseDown on:", link.href);
                                        haptics.tap();
                                    }}
                                    aria-label={link.label}
                                    aria-current={isActive ? "page" : undefined}
                                    className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full select-none relative z-50 pointer-events-auto rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
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
                                        "p-1 rounded-xl transition-all duration-300",
                                        isActive ? "bg-sky-50 dark:bg-sky-900/50" : "hover:bg-muted/50"
                                    )}>
                                        <Icon
                                            size={20}
                                            className={cn(
                                                "transition-all duration-300",
                                                isActive ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground"
                                            )}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-semibold tracking-tight transition-colors duration-300",
                                        isActive ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground"
                                    )}>
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
            </div>
        </>
    );

    return portal ? createPortal(navContent, document.body) : navContent;
}
