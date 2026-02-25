"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Lock, Unlock } from "lucide-react";
import { fetchProfileData, verifySecurityPin, toggleHideBalanceAction } from "@/app/(protected)/profile/actions";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

interface SecurityContextType {
    isLocked: boolean;
    unlock: (pin: string) => Promise<{ success: boolean; message?: string }>;
    isEnabled: boolean;
    hasPin: boolean;
    isStealthMode: boolean;
    toggleStealth: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function useSecurity() {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
}

export function SecurityProvider({ children }: { children: ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [isStealthMode, setIsStealthMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [inputPin, setInputPin] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        checkSecuritySettings();
    }, []);

    const checkSecuritySettings = async () => {
        try {
            const data = await fetchProfileData();
            const settings = data?.settings;
            const enabled = settings?.isAppLockEnabled || false;
            const pinExists = settings?.hasPin || false;
            const stealth = settings?.hideBalance || false;

            setIsEnabled(enabled);
            setHasPin(pinExists);
            setIsStealthMode(stealth);

            if (!enabled || !pinExists) {
                setIsLocked(false);
            } else {
                const sessionUnlocked = sessionStorage.getItem("monev_unlocked");
                if (sessionUnlocked === "true") {
                    setIsLocked(false);
                } else {
                    setIsLocked(true);
                }
            }
        } catch (error) {
            console.error("Failed to check security settings", error);
            setIsLocked(false);
        } finally {
            setIsLoading(false);
        }
    };

    const lockApp = useCallback(() => {
        if (isEnabled && hasPin) {
            setIsLocked(true);
            sessionStorage.removeItem("monev_unlocked");
        }
    }, [isEnabled, hasPin]);

    useEffect(() => {
        // Web: Visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                // If user leaves, we don't necessarily lock immediately
                // but we can if we want "High Resilience"
            } else if (document.visibilityState === "visible") {
                // Return to app -> lock
                lockApp();
            }
        };

        // Native: App state change
        let listener: any;
        if (Capacitor.isNativePlatform()) {
            App.addListener("appStateChange", ({ isActive }) => {
                if (!isActive) {
                    // Moving to background
                } else {
                    // Returning to active
                    lockApp();
                }
            }).then(l => listener = l);
        } else {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }

        return () => {
            if (listener) listener.remove();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [lockApp]);

    const toggleStealth = async () => {
        const newValue = !isStealthMode;
        setIsStealthMode(newValue);
        try {
            await toggleHideBalanceAction(newValue);
        } catch (e) {
            console.error(e);
            // Fallback
            setIsStealthMode(!newValue);
        }
    };

    const unlock = async (pin: string): Promise<{ success: boolean; message?: string }> => {
        const result = await verifySecurityPin(pin);

        if (result.success) {
            setIsLocked(false);
            sessionStorage.setItem("monev_unlocked", "true");
            return { success: true };
        }

        return {
            success: false,
            message: result.message || "PIN salah. Silakan coba lagi."
        };
    };

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const result = await unlock(inputPin);

        if (result.success) {
            setInputPin("");
            setErrorMessage(null);
        } else {
            setErrorMessage(result.message || "PIN salah. Silakan coba lagi.");
            setInputPin("");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    // LOCK SCREEN UI
    if (isLocked && isEnabled && hasPin) {
        return (
            <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/30">
                            <Lock size={32} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Aplikasi Terkunci</h1>
                        <p className="text-slate-500">Masukkan PIN 6 digit Anda untuk masuk.</p>
                    </div>

                    <form onSubmit={handleUnlockSubmit} className="space-y-6">
                        <div className="flex justify-center">
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={inputPin}
                                onChange={(e) => {
                                    if (e.target.value.length <= 6) setInputPin(e.target.value);
                                    setErrorMessage(null);
                                }}
                                className={`w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${errorMessage
                                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600 bg-rose-50"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 bg-white"
                                    }`}
                                placeholder="••••••"
                                autoFocus
                            />
                        </div>

                        {errorMessage && (
                            <p className="text-center text-rose-500 text-sm font-medium">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={inputPin.length !== 6}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            <Unlock size={20} />
                            Buka Kunci
                        </button>
                    </form>

                    <p className="text-center mt-8 text-xs text-slate-400">
                        Lupa PIN? Hubungi administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <SecurityContext.Provider value={{ isLocked, unlock, isEnabled, hasPin, isStealthMode, toggleStealth }}>
            {children}
        </SecurityContext.Provider>
    );
}
