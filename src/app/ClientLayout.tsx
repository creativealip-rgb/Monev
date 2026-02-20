"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";
import { BottomNav } from "@/frontend/components/BottomNav";
import { AddTransactionSheet } from "@/frontend/components/AddTransactionSheet";
import { NativeNotificationService } from "@/components/NativeNotificationService";
import { NotificationListenerService } from "@/components/NotificationListenerService";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeroThemeProvider } from "@/frontend/lib/hero-theme";
import { ThemeProvider } from "@/frontend/lib/theme-context";
import { CurrencyProvider } from "@/frontend/lib/currency-context";
import { I18nProvider } from "@/frontend/lib/i18n-context";
import { ToastProvider } from "@/frontend/components/Toast";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    useEffect(() => {
        const platform = Capacitor.getPlatform();
        const isNative = platform === 'ios' || platform === 'android';

        if (isNative) {
            document.documentElement.classList.add("is-native");
            document.body.classList.add("is-native");
            console.log("Platform: Native (" + platform + ")");
        } else {
            document.documentElement.classList.remove("is-native");
            document.body.classList.remove("is-native");
            console.log("Platform: Web");
        }
    }, []);

    return (
        <HeroThemeProvider>
            <ThemeProvider>
                <CurrencyProvider>
                    <I18nProvider>
                        <ToastProvider>
                            <ErrorBoundary>
                                <NativeNotificationService />
                                <NotificationListenerService />
                                <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-sky-100/50 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-transparent dark:from-sky-900/30" />
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-200/30 via-transparent to-transparent dark:from-indigo-900/30" />
                                </div>

                                <main className="min-h-screen max-w-[500px] mx-auto bg-background/80 backdrop-blur-xl shadow-2xl shadow-sky-900/10 dark:shadow-black/20 pb-24 relative">
                                    {children}
                                </main>

                                <BottomNav onFabClick={() => setIsAddSheetOpen(true)} />
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
