"use client";

import { motion } from "framer-motion";
import { ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/frontend/lib/utils";
import type { HealthScoreResult } from "@/lib/health-score";

export function HealthScoreWidget({ data }: { data: HealthScoreResult }) {
    const [expanded, setExpanded] = useState(false);

    // Circle progress properties
    const strokeWidth = 6;
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (data.score / 100) * circumference;

    return (
        <div className="card-clean overflow-hidden group">
            <div
                className="relative cursor-pointer p-3 sm:p-3.5"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center sm:h-14 sm:w-14">
                            {/* Background circle */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80" overflow="visible">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r={radius}
                                    className="text-slate-100 dark:text-slate-800"
                                    strokeWidth={strokeWidth}
                                    stroke="currentColor"
                                    fill="transparent"
                                />
                                {/* Progress circle */}
                                <motion.circle
                                    cx="40"
                                    cy="40"
                                    r={radius}
                                    stroke={data.color}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    style={{ strokeDasharray: circumference }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base font-black text-foreground sm:text-lg">{data.score}</span>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                                <h3 className="text-xs font-black text-foreground sm:text-sm">Health Score</h3>
                                <div
                                    className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white sm:text-[9px]"
                                    style={{ backgroundColor: data.color }}
                                >
                                    {data.label} {data.emoji}
                                </div>
                            </div>
                            <p className="line-clamp-1 max-w-[240px] text-[11px] font-medium text-muted-foreground sm:text-xs">
                                {data.tip}
                            </p>
                        </div>
                    </div>

                    <div className={cn(
                        "flex h-7 w-7 rounded-full bg-slate-50 dark:bg-slate-800/50 items-center justify-center text-slate-400 transition-transform",
                        expanded ? "rotate-90" : ""
                    )}>
                        <ChevronRight size={16} />
                    </div>
                </div>
            </div>

            {/* Expanded Breakdown */}
            <motion.div
                initial={false}
                animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                className="overflow-hidden bg-slate-50 dark:bg-slate-800/20"
            >
                <div className="space-y-3 border-t border-slate-100 p-3.5 dark:border-slate-800">
                    <div className="mb-1 flex items-center gap-1.5">
                        <Info size={13} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Breakdown Skor</span>
                    </div>

                    {Object.entries(data.breakdown).map(([key, item]) => {
                        const progress = (item.score / item.max) * 100;
                        let colorClass = "bg-sky-500";
                        if (progress < 40) colorClass = "bg-rose-500";
                        else if (progress < 70) colorClass = "bg-amber-500";
                        else if (progress >= 100) colorClass = "bg-emerald-500";

                        return (
                            <div key={key}>
                                <div className="mb-1 flex justify-between text-[11px]">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                                    <span className="font-bold text-foreground">{item.score}/{item.max}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/50">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: expanded ? `${progress}%` : 0 }}
                                        transition={{ duration: 1, delay: 0.1 }}
                                        className={cn("h-full rounded-full", colorClass)}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    );
}
