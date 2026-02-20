"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Sparkles, Loader2, Wallet, ArrowRight } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { authenticate } from "@/app/actions/auth";

interface CTAScreenProps {
    initialBalance: number;
    currency: string;
    onRegister: () => void;
    onLogin: () => void;
    onGuest: () => void;
}

export function CTAScreen({ initialBalance, currency, onRegister, onLogin, onGuest }: CTAScreenProps) {
    const [loading, setLoading] = useState<"register" | "login" | "guest" | null>(null);

    const handleGuest = async () => {
        setLoading("guest");
        try {
            // Call the guest login API with initial balance
            const response = await apiFetch("/api/auth/guest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    initialBalance: initialBalance,
                }),
            });

            const result = await response.json();

            if (result.success && result.credentials) {
                // Sign in with the created credentials
                const formData = new FormData();
                formData.append("email", result.credentials.email);
                formData.append("password", result.credentials.password);

                const authResult = await authenticate(undefined, formData);

                if (!authResult) {
                    // Success - redirect to dashboard
                    onGuest();
                } else {
                    console.error("Guest auth failed:", authResult);
                    // Still try to proceed
                    onGuest();
                }
            } else {
                // Fallback: just redirect to dashboard as guest
                onGuest();
            }
        } catch (error) {
            console.error("Guest login error:", error);
            // Still try to proceed
            onGuest();
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4">
                <div className="pt-2 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">Monev</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center px-6 py-8">
                {/* Celebration Icon */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1
                    }}
                    className="mb-8"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-28 h-28 mx-auto bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-orange-500/30"
                    >
                        <Sparkles className="w-14 h-14 text-white" />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black text-slate-900 dark:text-white text-center mb-3"
                >
                    Siap Memulai!
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-500 dark:text-slate-400 text-center text-lg mb-10"
                >
                    Pilih cara untuk mulai menggunakan Monev
                </motion.p>

                {/* Primary Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    {/* Create Account Button */}
                    <button
                        onClick={onRegister}
                        disabled={loading !== null}
                        className={cn(
                            "w-full flex items-center justify-center gap-3",
                            "btn-primary py-4 text-base font-semibold rounded-2xl",
                            "hover:shadow-xl hover:shadow-sky-500/30",
                            "active:scale-[0.98] transition-all duration-200",
                            (loading === "register" || loading === "login" || loading === "guest") && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {loading === "register" ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Buat Akun Baru
                            </>
                        )}
                    </button>

                    {/* Login Button */}
                    <button
                        onClick={onLogin}
                        disabled={loading !== null}
                        className={cn(
                            "w-full flex items-center justify-center gap-3",
                            "py-4 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700",
                            "text-slate-700 dark:text-slate-200 font-semibold",
                            "hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20",
                            "active:scale-[0.98] transition-all duration-200",
                            (loading === "register" || loading === "login" || loading === "guest") && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {loading === "login" ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Sudah Punya Akun? Login
                            </>
                        )}
                    </button>
                </motion.div>
            </div>

            {/* Guest Mode */}
            <div className="sticky bottom-0 p-6 pb-8 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <button
                        onClick={handleGuest}
                        disabled={loading !== null}
                        className={cn(
                            "inline-flex items-center gap-2 text-sm font-medium transition-colors",
                            loading === "guest" ? "text-slate-300 dark:text-slate-600" : "text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
                        )}
                    >
                        {loading === "guest" ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Masuk sebagai tamu...
                            </>
                        ) : (
                            <>
                                Coba Tanpa Akun
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-2">
                        Data tersimpan di perangkat
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
