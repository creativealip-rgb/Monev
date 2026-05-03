"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/frontend/components/BottomNav";
import { AddTransactionSheet } from "@/frontend/components/AddTransactionSheet";
import { NativeNotificationService } from "@/components/NativeNotificationService";
import { NotificationListenerService } from "@/components/NotificationListenerService";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus";
import { HeroThemeProvider } from "@/frontend/lib/hero-theme";
import { ThemeProvider } from "@/frontend/lib/theme-context";
import { CurrencyProvider } from "@/frontend/lib/currency-context";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/frontend/components/Toast";
import { cn } from "@/frontend/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SecurityGuard } from "@/frontend/components/SecurityGuard";
import { OfflineBadge } from "@/frontend/components/OfflineBadge";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isBottomNavSuppressed, setIsBottomNavSuppressed] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const openAddTransaction = () => setIsAddSheetOpen(true);
        const suppressBottomNav = (event: Event) => {
            setIsBottomNavSuppressed(Boolean((event as CustomEvent<boolean>).detail));
        };

        window.addEventListener("monev:open-add-transaction", openAddTransaction);
        window.addEventListener("monev:suppress-bottom-nav", suppressBottomNav);

        return () => {
            window.removeEventListener("monev:open-add-transaction", openAddTransaction);
            window.removeEventListener("monev:suppress-bottom-nav", suppressBottomNav);
        };
    }, []);

    useEffect(() => {
        const platform = Capacitor.getPlatform();
        const isNative = platform === 'ios' || platform === 'android';

        if (isNative) {
            document.documentElement.classList.add("is-native");
            document.body.classList.add("is-native");

            // Init Capacitor plugins
            (async () => {
                try {
                    // StatusBar: transparent overlay
                    const { StatusBar, Style } = await import("@capacitor/status-bar");
                    await StatusBar.setOverlaysWebView({ overlay: true });
                    await StatusBar.setStyle({ style: Style.Light });
                    await StatusBar.setBackgroundColor({ color: '#00000000' });
                } catch (e) { console.warn("[StatusBar]", e); }

                try {
                    // Keyboard: resize body
                    const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
                    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
                } catch (e) { console.warn("[Keyboard]", e); }

                try {
                    // SplashScreen: hide after app ready
                    const { SplashScreen } = await import("@capacitor/splash-screen");
                    await SplashScreen.hide({ fadeOutDuration: 300 });
                } catch (e) { console.warn("[SplashScreen]", e); }

                try {
                    // Back button: navigate back or minimize app
                    const { App: CapApp } = await import("@capacitor/app");
                    CapApp.addListener('backButton', ({ canGoBack }) => {
                        if (canGoBack) {
                            window.history.back();
                        } else {
                            CapApp.minimizeApp();
                        }
                    });
                } catch (e) { console.warn("[App]", e); }
            })();
        } else {
            document.documentElement.classList.remove("is-native");
            document.body.classList.remove("is-native");
        }

        return () => {
            if (Capacitor.isNativePlatform()) {
                import("@capacitor/app").then(({ App: CapApp }) => {
                    CapApp.removeAllListeners();
                }).catch(() => { });
            }
        };
    }, []);

    return (
        <HeroThemeProvider>
            <ThemeProvider>
                <CurrencyProvider>
                    <I18nProvider>
                        <ToastProvider>
                            <ErrorBoundary>
                                <NetworkStatus />
                                <NativeNotificationService />
                                <NotificationListenerService />
                                <OfflineBadge />
                                <div className={cn(
                                    "fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-sky-100/50 to-cyan-100",
                                    !["/login", "/register"].includes(pathname) && "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
                                )}>
                                    <div className={cn(
                                        "absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-transparent",
                                        !["/login", "/register"].includes(pathname) && "dark:from-sky-900/30"
                                    )} />
                                    <div className={cn(
                                        "absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-200/30 via-transparent to-transparent",
                                        !["/login", "/register"].includes(pathname) && "dark:from-indigo-900/30"
                                    )} />
                                </div>

                                <main className={cn(
                                    "min-h-screen max-w-[500px] mx-auto bg-background/80 backdrop-blur-xl relative shadow-2xl shadow-sky-900/10",
                                    !["/login", "/register", "/chat"].includes(pathname) && "pb-[calc(9rem+env(safe-area-inset-bottom))]",
                                    !["/login", "/register"].includes(pathname) && "dark:shadow-black/20"
                                )}>
                                    <SecurityGuard>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={pathname}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                            >
                                                {children}
                                            </motion.div>
                                        </AnimatePresence>
                                    </SecurityGuard>
                                </main>

                                {pathname !== "/chat" && !isAddSheetOpen && !isBottomNavSuppressed && <BottomNav onFabClick={() => setIsAddSheetOpen(true)} />}
                                <AddTransactionSheet
                                    isOpen={isAddSheetOpen}
                                    onClose={() => setIsAddSheetOpen(false)}
                                    onSuccess={() => {
                                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                                    }}
                                />
                            </ErrorBoundary>
                        </ToastProvider>
                    </I18nProvider>
                </CurrencyProvider>
            </ThemeProvider>
        </HeroThemeProvider>
    );
}
