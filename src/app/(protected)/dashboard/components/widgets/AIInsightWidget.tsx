"use client";

import { TrendingUp, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/frontend/lib/utils";
import type { AIInsightWidgetProps } from "../../types";

const config = {
    success: { icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-800/50" },
    warning: { icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-900/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-800/50" },
    info: { icon: Sparkles, bg: "bg-sky-50 dark:bg-sky-900/10", text: "text-sky-600 dark:text-sky-400", border: "border-sky-100 dark:border-sky-800/50" },
};

export function AIInsightWidget({ insight, type, generatedAt, onRefresh }: AIInsightWidgetProps) {
    const { icon: Icon, bg, text, border } = config[type];

    const formattedTime = generatedAt
        ? format(new Date(generatedAt), "HH:mm", { locale: id })
        : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("relative overflow-hidden rounded-2xl border p-3 transition-all", bg, border)}
        >
            <div className="flex items-start gap-3">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm", bg, "brightness-95")}>
                    <Icon size={17} className={text} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-70", text)}>AI Insight</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                            {formattedTime && (
                                <span className="hidden text-[9px] text-slate-500 dark:text-slate-400 sm:inline">{formattedTime}</span>
                            )}
                            <button
                                type="button"
                                onClick={onRefresh}
                                aria-label="Muat ulang insight AI"
                                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-300"
                            >
                                <RefreshCw size={11} />
                            </button>
                        </div>
                    </div>
                    <p className={cn("line-clamp-2 text-[11px] font-bold leading-snug sm:text-xs", text)}>
                        {insight}
                    </p>
                </div>
            </div>

            <div className="pointer-events-none absolute -right-3 -bottom-4 opacity-10">
                <Icon size={64} className={text} />
            </div>
        </motion.div>
    );
}
