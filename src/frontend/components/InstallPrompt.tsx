"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, Smartphone } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA Install Prompt component.
 * Shows a contextual install banner:
 * - Android/Chrome: uses beforeinstallprompt event
 * - iOS Safari: shows manual "Add to Home Screen" instructions
 * 
 * Only appears after user is logged in and has dismissed at most 3 times.
 */
export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const standalone = window.matchMedia("(display-mode: standalone)").matches
            || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        setIsStandalone(standalone);

        if (standalone) return; // Already installed, don't show anything

        // Check dismiss count
        const dismissCount = parseInt(localStorage.getItem("monev_install_dismiss_count") || "0");
        const lastDismiss = localStorage.getItem("monev_install_last_dismiss");

        // If dismissed 3+ times, don't show again for 30 days
        if (dismissCount >= 3) {
            if (lastDismiss) {
                const daysSince = (Date.now() - parseInt(lastDismiss)) / (1000 * 60 * 60 * 24);
                if (daysSince < 30) return;
            }
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // Show iOS instructions after a short delay
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }

        // Listen for beforeinstallprompt (Chrome/Edge/Android)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show banner after a short delay to not overwhelm user
            setTimeout(() => setShowBanner(true), 2000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === "accepted") {
                setShowBanner(false);
                localStorage.removeItem("monev_install_dismiss_count");
            }
        } catch (error) {
            console.error("[InstallPrompt] Install failed:", error);
        }

        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        setShowIOSInstructions(false);

        const count = parseInt(localStorage.getItem("monev_install_dismiss_count") || "0");
        localStorage.setItem("monev_install_dismiss_count", String(count + 1));
        localStorage.setItem("monev_install_last_dismiss", String(Date.now()));
    }, []);

    // Don't render if already installed
    if (isStandalone) return null;

    return (
        <>
            {/* Install Banner */}
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 left-4 right-4 z-[100000] max-w-[468px] mx-auto"
                    >
                        <div className={cn(
                            "rounded-2xl p-4 shadow-2xl border",
                            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                            "border-sky-100 dark:border-sky-900/30",
                            "shadow-sky-500/10 dark:shadow-black/30"
                        )}>
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-sky-500/20">
                                    <Smartphone size={24} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                        Install Monev
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                        {isIOS
                                            ? "Tambahkan Monev ke Home Screen untuk pengalaman terbaik."
                                            : "Install Monev untuk akses cepat dan notifikasi."
                                        }
                                    </p>

                                    <div className="flex items-center gap-2 mt-3">
                                        {isIOS ? (
                                            <button
                                                onClick={() => setShowIOSInstructions(true)}
                                                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-sky-500/20"
                                            >
                                                Lihat Cara Install
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleInstall}
                                                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                                            >
                                                <Download size={14} />
                                                Install
                                            </button>
                                        )}

                                        <button
                                            onClick={handleDismiss}
                                            className="px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-medium transition-colors"
                                        >
                                            Nanti
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDismiss}
                                    className="p-1 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* iOS Instructions Modal */}
            <AnimatePresence>
                {showIOSInstructions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200000] bg-black/50 backdrop-blur-sm flex items-end justify-center px-4 pb-8"
                        onClick={handleDismiss}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-[468px] bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-sky-500/20">
                                    <Smartphone size={32} />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                    Install Monev di iPhone
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Ikuti langkah berikut untuk menambahkan Monev ke Home Screen kamu.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Tap tombol <Share size={14} className="inline text-sky-500" /> Share
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Di bagian bawah Safari
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Pilih <Plus size={14} className="inline text-sky-500" /> Add to Home Screen
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Scroll ke bawah jika tidak terlihat
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 font-bold text-sm flex-shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Tap &quot;Add&quot;
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Monev akan muncul di Home Screen kamu
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    💡 Untuk menerima notifikasi di iPhone, buka Monev dari icon di Home Screen, lalu aktifkan notifikasi dari menu Profil.
                                </p>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="w-full mt-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                Mengerti
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
