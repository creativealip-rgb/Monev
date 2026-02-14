"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lock, Unlock, ShieldCheck } from "lucide-react";
import { fetchProfileData } from "@/app/(protected)/profile/actions";

interface SecurityContextType {
    isLocked: boolean;
    unlock: (pin: string) => Promise<boolean>;
    isEnabled: boolean;
    hasPin: boolean;
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
    const [storedPin, setStoredPin] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(true); // Default to locked until verified
    const [isLoading, setIsLoading] = useState(true);
    const [inputPin, setInputPin] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        checkSecuritySettings();
    }, []);

    const checkSecuritySettings = async () => {
        try {
            const data = await fetchProfileData();
            const settings = data?.settings;
            const enabled = settings?.isAppLockEnabled || false;
            const pin = settings?.securityPin || null;

            setIsEnabled(enabled);
            setStoredPin(pin);

            // Logic:
            // If NOT enabled -> Not Locked.
            // If Enabled -> Check Session Storage.
            // If Session says "unlocked", then Not Locked.
            // Else -> Locked.

            if (!enabled || !pin) {
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
            // Fail safe? Or Fail lock? Fail safe for now to avoid locking out on network error
            setIsLocked(false);
        } finally {
            setIsLoading(false);
        }
    };

    const unlock = async (pin: string) => {
        if (storedPin === pin) {
            setIsLocked(false);
            sessionStorage.setItem("monev_unlocked", "true");
            return true;
        }
        return false;
    };

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await unlock(inputPin);
        if (success) {
            setInputPin("");
            setError(false);
        } else {
            setError(true);
            setInputPin("");
            // Shake effect logic typically handled by UI/Framer
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
    if (isLocked && isEnabled && storedPin) {
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
                                    setError(false);
                                }}
                                className={`w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${error
                                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600 bg-rose-50"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 bg-white"
                                    }`}
                                placeholder="••••••"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-center text-rose-500 text-sm font-medium animate-pulse">
                                PIN salah. Silakan coba lagi.
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
        <SecurityContext.Provider value={{ isLocked, unlock, isEnabled, hasPin: !!storedPin }}>
            {children}
        </SecurityContext.Provider>
    );
}
