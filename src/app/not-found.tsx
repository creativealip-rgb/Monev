"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="max-w-sm w-full"
            >
                {/* Emoji */}
                <div className="text-8xl mb-6">😅</div>

                {/* Title */}
                <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                    Halaman Hilang
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                    Sepertinya halaman yang kamu cari sudah kabur bawa uangnya. Kita cari yang lain aja ya, Bos!
                </p>

                {/* Error code badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold mb-8">
                    <AlertTriangle size={16} />
                    Error 404 — Tidak Ditemukan
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/dashboard"
                        className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition-all active:scale-95"
                    >
                        🏠 Kembali ke Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground font-bold text-sm transition-all hover:bg-slate-50 active:scale-95"
                    >
                        ← Halaman Sebelumnya
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
