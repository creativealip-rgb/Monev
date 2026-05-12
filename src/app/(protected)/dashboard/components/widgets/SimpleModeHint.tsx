"use client";

import { motion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { useViewMode } from "@/frontend/hooks/useViewMode";

export function SimpleModeHint() {
    const { setViewMode } = useViewMode();

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="px-4 mb-4 sm:px-6 sm:mb-6"
        >
            <div className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                        <Layers3 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-950 dark:text-white">Simple Mode aktif</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                            Fokus ke saldo, ringkasan hari ini, dan transaksi terakhir. Butuh budget, laporan, tagihan, AI, atau investasi?
                        </p>
                        <button
                            type="button"
                            onClick={() => setViewMode("advanced")}
                            className="mt-3 rounded-full bg-sky-500 px-4 py-2 text-xs font-black text-white shadow-sm shadow-sky-500/25 transition hover:bg-sky-600"
                        >
                            Aktifkan Advanced
                        </button>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
