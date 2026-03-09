"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Lock, Unlock } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { apiFetch } from "@/frontend/lib/api-client";
import { Fingerprint } from "lucide-react";
import { authenticateBiometric, isBiometricSupported } from "@/lib/biometric";
import { deriveKeyFromSeed } from "@/lib/encryption";

interface SecurityContextType {
    isLocked: boolean;
    unlock: (pin: string) => Promise<{ success: boolean; message?: string }>;
    isEnabled: boolean;
    hasPin: boolean;
    isBiometricEnabled: boolean;
    isStealthMode: boolean;
    isDecoyMode: boolean;
    encryptionKey: CryptoKey | null;
    autoLockTimeout: number;
    toggleStealth: () => Promise<void>;
    tryBiometricUnlock: () => Promise<boolean>;
    reauthenticate: () => Promise<boolean>;
    deleteLocalData: () => void;
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
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isStealthMode, setIsStealthMode] = useState(false);
    const [isDecoyMode, setIsDecoyMode] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inputPin, setInputPin] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [autoLockTimeout, setAutoLockTimeout] = useState(300000); // Default 5 mins

    // Re-auth state
    const [reauthPromise, setReauthPromise] = useState<{ resolve: (val: boolean) => void } | null>(null);

    useEffect(() => {
        checkSecuritySettings();
    }, []);

    const checkSecuritySettings = async () => {
        try {
            const response = await apiFetch("/api/profile");
            const result = await response.json();

            if (result.success) {
                const settings = result.data?.settings;
                const enabled = settings?.isAppLockEnabled || false;
                const pinExists = settings?.hasPin || false;
                const biometric = settings?.isBiometricEnabled || false;
                const timeout = settings?.autoLockTimeout ?? 300000;

                // Check localStorage first for stealth mode (user preference)
                const savedStealth = localStorage.getItem("monev_stealth_mode");
                const dbStealth = settings?.hideBalance || false;
                const stealth = savedStealth !== null ? savedStealth === "true" : dbStealth;

                setIsEnabled(enabled);
                setHasPin(pinExists);
                setIsStealthMode(stealth);
                setIsBiometricEnabled(biometric);
                setAutoLockTimeout(timeout);

                // Check hardware availability
                const available = await isBiometricSupported();
                setIsBiometricAvailable(available);

                if (!enabled || !pinExists) {
                    setIsLocked(false);
                } else {
                    const sessionUnlocked = sessionStorage.getItem("monev_unlocked");
                    const sessionDecoy = sessionStorage.getItem("monev_decoy") === "true";
                    if (sessionUnlocked === "true") {
                        setIsLocked(false);
                        setIsDecoyMode(sessionDecoy);
                    } else {
                        setIsLocked(true);
                    }
                }
            } else {
                setIsLocked(false);
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
            setIsDecoyMode(false);
            sessionStorage.removeItem("monev_unlocked");
            sessionStorage.removeItem("monev_decoy");
        }
    }, [isEnabled, hasPin]);

    const deleteLocalData = useCallback(() => {
        sessionStorage.clear();
        localStorage.removeItem("monev_last_activity");
        window.location.reload();
    }, []);

    useEffect(() => {
        // Don't auto-lock if timeout is set to -1 (Never)
        if (autoLockTimeout === -1) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                const last = parseInt(localStorage.getItem("monev_last_activity") || "0");
                const now = Date.now();
                if (now - last > autoLockTimeout) {
                    lockApp();
                }
            }
        };

        const updateActivity = () => {
            const now = Date.now();
            setLastActivity(now);
            localStorage.setItem("monev_last_activity", now.toString());
        };

        window.addEventListener("mousedown", updateActivity);
        window.addEventListener("keydown", updateActivity);
        window.addEventListener("touchstart", updateActivity);

        let listener: any;
        if (Capacitor.isNativePlatform()) {
            App.addListener("appStateChange", ({ isActive }) => {
                if (!isActive) {
                    localStorage.setItem("monev_last_activity", Date.now().toString());
                } else {
                    const last = parseInt(localStorage.getItem("monev_last_activity") || "0");
                    const now = Date.now();
                    if (now - last > autoLockTimeout) {
                        lockApp();
                    }
                }
            }).then(l => listener = l);
        } else {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }

        return () => {
            if (listener) listener.remove();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("mousedown", updateActivity);
            window.removeEventListener("keydown", updateActivity);
            window.removeEventListener("touchstart", updateActivity);
        };
    }, [lockApp, autoLockTimeout]);

    const toggleStealth = async () => {
        const newValue = !isStealthMode;
        setIsStealthMode(newValue);
        // Save to localStorage for persistence
        localStorage.setItem("monev_stealth_mode", newValue.toString());
        try {
            await apiFetch("/api/profile", {
                method: "POST",
                body: JSON.stringify({ type: "settings", hideBalance: newValue })
            });
        } catch (e) {
            console.error(e);
            // Revert localStorage if API fails
            localStorage.setItem("monev_stealth_mode", (!newValue).toString());
            setIsStealthMode(!newValue);
        }
    };

    const tryBiometricUnlock = useCallback(async () => {
        if (isBiometricEnabled && isBiometricAvailable) {
            const success = await authenticateBiometric();
            if (success) {
                if (reauthPromise) {
                    reauthPromise.resolve(true);
                    setReauthPromise(null);
                } else {
                    setIsLocked(false);
                    sessionStorage.setItem("monev_unlocked", "true");
                }
                return true;
            }
        }
        return false;
    }, [isBiometricEnabled, isBiometricAvailable, reauthPromise]);

    useEffect(() => {
        if (isLocked && isBiometricEnabled && isBiometricAvailable && !reauthPromise) {
            const timer = setTimeout(() => {
                tryBiometricUnlock();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLocked, isBiometricEnabled, isBiometricAvailable, tryBiometricUnlock, reauthPromise]);

    const unlock = async (pin: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await apiFetch("/api/profile/verify-pin", {
                method: "POST",
                body: JSON.stringify({ pin })
            });
            const result = await response.json();

            if (result.success) {
                if (!result.isDecoy) {
                    try {
                        const key = await deriveKeyFromSeed(pin, "monev-salt");
                        setEncryptionKey(key);
                    } catch (e) {
                        console.error("Failed to derive encryption key", e);
                    }
                }

                if (reauthPromise) {
                    reauthPromise.resolve(true);
                    setReauthPromise(null);
                } else {
                    setIsLocked(false);
                    setIsDecoyMode(!!result.isDecoy);
                    sessionStorage.setItem("monev_unlocked", "true");
                    sessionStorage.setItem("monev_decoy", result.isDecoy ? "true" : "false");
                }
                return { success: true };
            }

            return {
                success: false,
                message: result.message || "PIN salah. Silakan coba lagi."
            };
        } catch (error: any) {
            return {
                success: false,
                message: "Gagal verifikasi PIN. Cek koneksi internet."
            };
        }
    };

    const reauthenticate = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (isBiometricEnabled && isBiometricAvailable) {
                authenticateBiometric().then(success => {
                    if (success) resolve(true);
                    else {
                        setReauthPromise({ resolve });
                    }
                });
            } else {
                setReauthPromise({ resolve });
            }
        });
    };

    const [isAppBlurred, setIsAppBlurred] = useState(false);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "hidden") {
                setIsAppBlurred(true);
            } else {
                // Keep it blurred if still locked
                if (!isLocked) setIsAppBlurred(false);
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [isLocked]);

    // Update blur when lock state changes
    useEffect(() => {
        if (isLocked) {
            setIsAppBlurred(true);
        } else if (document.visibilityState === "visible") {
            setIsAppBlurred(false);
        }
    }, [isLocked]);

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        const result = await unlock(inputPin);
        if (result.success) {
            setInputPin("");
            setErrorMessage(null);
            setIsAppBlurred(false);
        } else {
            setErrorMessage(result.message || "PIN salah. Silakan coba lagi.");
            setInputPin("");
        }
    };

    const handleCancelReauth = () => {
        if (reauthPromise) {
            reauthPromise.resolve(false);
            setReauthPromise(null);
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

    // RE-AUTHENTICATION MODAL
    const ReauthModal = reauthPromise && (
        <div className="fixed inset-0 z-[2000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-6">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-amber-500/20">
                        <Fingerprint size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Verifikasi Keamanan</h2>
                    <p className="text-slate-500 text-sm">Masukkan PIN Anda untuk melanjutkan tindakan sensitif ini.</p>
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
                            className={`w-full text-center text-2xl font-bold tracking-[0.5em] py-4 rounded-2xl border-2 focus:outline-none focus:ring-4 transition-all ${errorMessage
                                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600 bg-rose-50"
                                : "border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-amber-500/20 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800"
                                }`}
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>
                    {errorMessage && <p className="text-center text-rose-500 text-xs font-bold">{errorMessage}</p>}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleCancelReauth}
                            className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={inputPin.length !== 6}
                            className="py-3 bg-amber-500 disabled:bg-slate-200 text-white font-bold rounded-xl"
                        >
                            Lanjut
                        </button>
                    </div>

                    {isBiometricEnabled && isBiometricAvailable && (
                        <button
                            type="button"
                            onClick={tryBiometricUnlock}
                            className="w-full py-3 border-2 border-sky-100 dark:border-sky-900/30 text-sky-600 font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            <Fingerprint size={18} />
                            Biometrik
                        </button>
                    )}
                </form>
            </div>
        </div>
    );

    // LOCK SCREEN UI
    const LockScreen = (isLocked && isEnabled && hasPin) && (
        <div className="fixed inset-0 z-[2000000] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/30">
                        <Lock size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Aplikasi Terkunci</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Masukkan PIN 6 digit Anda untuk masuk.</p>
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
                            className={`w-full text-center text-3xl font-bold tracking-[0.5em] py-5 rounded-[2rem] border-2 focus:outline-none focus:ring-4 transition-all ${errorMessage
                                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-600 bg-rose-50"
                                : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 text-slate-800 dark:text-white bg-white dark:bg-slate-900"
                                }`}
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>

                    {errorMessage && (
                        <p className="text-center text-rose-500 text-sm font-bold bg-rose-50 dark:bg-rose-900/20 py-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={inputPin.length !== 6}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                    >
                        <Unlock size={22} strokeWidth={2.5} />
                        BUKA KUNCI
                    </button>

                    {isBiometricEnabled && isBiometricAvailable && (
                        <button
                            type="button"
                            onClick={tryBiometricUnlock}
                            className="w-full py-4 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center gap-3"
                        >
                            <Fingerprint size={22} className="text-sky-500" />
                            BIOMETRIK
                        </button>
                    )}
                </form>

                <p className="text-center mt-12 text-[10px] text-slate-400 dark:text-slate-600 font-black tracking-widest uppercase">
                    Proteksi Keamanan Monev v1.0
                </p>
            </div>
        </div>
    );

    return (
        <SecurityContext.Provider value={{
            isLocked,
            unlock,
            isEnabled,
            hasPin,
            isBiometricEnabled,
            isStealthMode,
            isDecoyMode,
            encryptionKey,
            autoLockTimeout,
            toggleStealth,
            tryBiometricUnlock,
            reauthenticate,
            deleteLocalData
        }}>
            <div className={isAppBlurred ? "blur-xl lg:blur-3xl transition-all duration-300" : "transition-all duration-300"}>
                {children}
            </div>
            {LockScreen}
            {ReauthModal}
        </SecurityContext.Provider>
    );
}
