"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
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
import { motion } from "framer-motion";
import { SecurityGuard } from "@/frontend/components/SecurityGuard";
import { OfflineBadge } from "@/frontend/components/OfflineBadge";
import { InstallPrompt } from "@/frontend/components/InstallPrompt";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [isBottomNavSuppressed, setIsBottomNavSuppressed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

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
        if (!Capacitor.isNativePlatform()) return;

        let removeListener: (() => void) | undefined;
        const handleDeepLink = async (url: string) => {
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== "monev:" || parsed.host !== "auth" || parsed.pathname !== "/callback") return;

                const token = parsed.searchParams.get("token");
                if (!token) return;

                const result = await signIn("mobile-handoff", {
                    token,
                    redirect: false,
                });

                if (!result?.error) {
                    router.push("/dashboard");
                    router.refresh();
                } else {
                    router.push("/login?error=mobile-handoff");
                }
            } catch (error) {
                console.warn("[MobileAuth] Failed to handle deep link", error);
                router.push("/login?error=mobile-handoff");
            }
        };

        import("@capacitor/app").then(async ({ App: CapApp }) => {
            const launchUrl = await CapApp.getLaunchUrl();
            if (launchUrl?.url) handleDeepLink(launchUrl.url);

            const listener = await CapApp.addListener("appUrlOpen", ({ url }) => {
                handleDeepLink(url);
            });
            removeListener = () => listener.remove();
        }).catch((error) => console.warn("[MobileAuth]", error));

        return () => removeListener?.();
    }, [router]);

    useEffect(() => {
        const platform = Capacitor.getPlatform();
        const isNative = platform === 'ios' || platform === 'android';

        if (isNative) {
            document.documentElement.classList.add("is-native");
            document.body.classList.add("is-native");

            // Init Capacitor plugins
            (async () => {
                try {
                    const { StatusBar } = await import("@capacitor/status-bar");
                    await StatusBar.setOverlaysWebView({ overlay: false });
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

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        import("@capacitor/status-bar").then(async ({ StatusBar, Style }) => {
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: "#020617" });
        }).catch((error) => console.warn("[StatusBar]", error));
    }, [pathname]);

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
                                <InstallPrompt />
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

                                <div className="native-system-bar native-system-bar-top" />
                                <div className="native-system-bar native-system-bar-bottom" />

                                <main className={cn(
                                    "min-h-screen max-w-[500px] mx-auto bg-background/80 backdrop-blur-xl relative shadow-2xl shadow-sky-900/10",
                                    !["/login", "/register", "/chat"].includes(pathname) && "pb-[calc(6.25rem+env(safe-area-inset-bottom))]",
                                    !["/login", "/register"].includes(pathname) && "dark:shadow-black/20"
                                )}>
                                    <SecurityGuard>
                                        <motion.div
                                            key={pathname}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                        >
                                            {children}
                                        </motion.div>
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
