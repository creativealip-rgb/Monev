"use client";

import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "capacitor-native-biometric";
import { App } from "@capacitor/app";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Fingerprint, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SecurityGuard");

interface SecurityGuardProps {
    children: React.ReactNode;
}

export function SecurityGuard({ children }: SecurityGuardProps) {
    const [isLocked, setIsLocked] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const authenticate = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return true;

        try {
            const result = await NativeBiometric.isAvailable();
            if (!result.isAvailable) return true;

            await NativeBiometric.verifyIdentity({
                reason: "Buka kunci Monev",
                title: "Otentikasi Diperlukan",
                subtitle: "Gunakan biometrik untuk lanjut",
                description: "Pastikan data keuangan Bos aman.",
            });

            setIsLocked(false);
            return true;
        } catch (error) {
            logger.error("Biometric Auth Failed", error);
            return false;
        }
    }, []);

    useEffect(() => {
        // Init: Check settings
        const init = async () => {
            if (!Capacitor.isNativePlatform()) {
                setIsChecking(false);
                return;
            }

            try {
                const res = await apiFetch("/api/user/settings");
                const data = await res.json();

                if (data.settings?.isBiometricEnabled) {
                    setIsBiometricEnabled(true);
                    // Initial lock
                    setIsLocked(true);
                    await authenticate();
                }
            } catch (e) {
                logger.error("Failed to fetch security settings", e);
            } finally {
                setIsChecking(false);
            }
        };

        init();

        let listener: any;

        const initListener = async () => {
            listener = await App.addListener("appStateChange", async ({ isActive }) => {
                if (isActive && isBiometricEnabled) {
                    setIsLocked(true);
                    await authenticate();
                }
            });
        };

        initListener();

        return () => {
            if (listener) listener.remove();
        };
    }, [isBiometricEnabled, authenticate]);

    if (isChecking) return null; // Or a splash screen

    return (
        <>
            <AnimatePresence>
                {isLocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-3xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 mb-8"
                        >
                            <Lock size={48} />
                        </motion.div>

                        <h2 className="text-2xl font-black mb-2">Aplikasi Terkunci</h2>
                        <p className="text-secondary mb-12 max-w-xs">
                            Gunakan sidik jari atau wajah Bos untuk membuka akses data keuangan.
                        </p>

                        <button
                            onClick={authenticate}
                            className="flex items-center gap-2 px-8 py-4 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                        >
                            <Fingerprint size={20} />
                            <span>Buka Sekarang</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </>
    );
}
