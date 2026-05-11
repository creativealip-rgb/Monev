"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

type SmartNotification = {
    id: number;
    type: "anomaly_spending" | "budget_warning" | "positive_reinforcement" | "weekly_recap";
    title: string;
    body: string;
    severity: "info" | "warning" | "critical";
    status: "pending" | "sent" | "dismissed";
};

const iconByType = {
    anomaly_spending: AlertTriangle,
    budget_warning: BellRing,
    positive_reinforcement: CheckCircle2,
    weekly_recap: Sparkles,
};

export function SmartNotificationCard() {
    const [items, setItems] = useState<SmartNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadNotifications() {
            try {
                const response = await fetch("/api/smart-notifications?generate=true");
                const json = await response.json();
                if (!cancelled && json.success) {
                    setItems((json.data || []).filter((item: SmartNotification) => item.status === "pending").slice(0, 3));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadNotifications();
        return () => {
            cancelled = true;
        };
    }, []);

    const dismiss = async (id: number) => {
        setItems((current) => current.filter((item) => item.id !== id));
        await fetch("/api/smart-notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "dismiss", id }),
        });
    };

    if (loading || items.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 mb-3 sm:px-6 sm:mb-4"
        >
            <div className="rounded-[22px] border border-sky-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-500">Smart Alert</p>
                        <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">Insight perlu dicek</h2>
                    </div>
                    <Sparkles className="h-4 w-4 shrink-0 text-sky-500" />
                </div>

                <div className="space-y-1.5">
                    {items.map((item) => {
                        const Icon = iconByType[item.type] || BellRing;
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center gap-2 rounded-2xl border px-3 py-2",
                                    item.severity === "critical" && "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30",
                                    item.severity === "warning" && "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
                                    item.severity === "info" && "border-sky-100 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30"
                                )}
                            >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm dark:bg-slate-900 dark:text-sky-300">
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-black text-slate-900 dark:text-white">{item.title}</p>
                                    <p className="line-clamp-1 text-[11px] leading-snug text-slate-600 dark:text-slate-300">{item.body}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dismiss(item.id)}
                                    className="h-fit shrink-0 rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white/80 dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    OK
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
}
