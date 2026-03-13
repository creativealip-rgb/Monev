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
            className={cn("relative overflow-hidden p-5 rounded-[2rem] border transition-all", bg, border)}
        >
            <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", bg, "brightness-95")}>
                    <Icon size={20} className={text} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-70", text)}>AI Insight</span>
                        <div className="flex items-center gap-2">
                            {formattedTime && (
                                <span className="text-[9px] text-slate-400">Updated {formattedTime}</span>
                            )}
                            <button
                                onClick={onRefresh}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    </div>
                    <p className={cn("text-xs font-bold leading-relaxed", text)}>
                        {insight}
                    </p>
                </div>
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icon size={80} className={text} />
            </div>
        </motion.div>
    );
}
