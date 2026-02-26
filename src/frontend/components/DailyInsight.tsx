"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, TrendingUp, RefreshCw } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

export function DailyInsight() {
    const [insight, setInsight] = useState<{ text: string, type: "success" | "warning" | "info" } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchInsight = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/api/ai/insight");
            const data = await res.json();
            if (data.success) {
                setInsight({ text: data.insight, type: data.type });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsight();
    }, []);

    if (loading) {
        return (
            <div className="w-full p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Sparkles size={20} className="text-slate-400" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
            </div>
        );
    }

    if (!insight) return null;

    const config = {
        success: { icon: TrendingUp, bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-800/50" },
        warning: { icon: AlertCircle, bg: "bg-rose-50 dark:bg-rose-900/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-800/50" },
        info: { icon: Sparkles, bg: "bg-sky-50 dark:bg-sky-900/10", text: "text-sky-600 dark:text-sky-400", border: "border-sky-100 dark:border-sky-800/50" },
    };

    const { icon: Icon, bg, text, border } = config[insight.type];

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
                        <button onClick={fetchInsight} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <RefreshCw size={12} />
                        </button>
                    </div>
                    <p className={cn("text-xs font-bold leading-relaxed", text)}>
                        {insight.text}
                    </p>
                </div>
            </div>

            {/* Background decorative element */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icon size={80} className={text} />
            </div>
        </motion.div>
    );
}
