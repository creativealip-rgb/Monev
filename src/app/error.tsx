"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-sm w-full"
            >
                <div className="text-7xl mb-6">🔧</div>

                <h1 className="text-2xl font-black text-foreground mb-2">Ups, Ada Masalah!</h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Terjadi kesalahan yang tidak terduga. Tim teknis sudah diberitahu.
                </p>

                {error.message && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-left">
                        <p className="text-xs font-mono text-red-600 dark:text-red-400 truncate">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RefreshCw size={16} />
                        Coba Lagi
                    </button>
                    <Link
                        href="/dashboard"
                        className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground font-bold text-sm transition-all hover:bg-slate-50 active:scale-95"
                    >
                        🏠 Kembali ke Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
