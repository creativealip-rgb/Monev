"use client";

import { motion } from "framer-motion";
import { ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/frontend/lib/utils";
import type { HealthScoreResult } from "@/lib/health-score";

export function HealthScoreWidget({ data }: { data: HealthScoreResult }) {
    const [expanded, setExpanded] = useState(false);

    // Circle progress properties
    const strokeWidth = 8;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (data.score / 100) * circumference;

    return (
        <div className="card-clean overflow-hidden group">
            <div
                className="p-5 cursor-pointer relative"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
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
                                <span className="text-xl font-black text-foreground">{data.score}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-foreground">Health Score</h3>
                                <div
                                    className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                                    style={{ backgroundColor: data.color }}
                                >
                                    {data.label} {data.emoji}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                                {data.tip}
                            </p>
                        </div>
                    </div>

                    <div className={cn(
                        "w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 transition-transform",
                        expanded ? "rotate-90" : ""
                    )}>
                        <ChevronRight size={18} />
                    </div>
                </div>
            </div>

            {/* Expanded Breakdown */}
            <motion.div
                initial={false}
                animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                className="overflow-hidden bg-slate-50 dark:bg-slate-800/20"
            >
                <div className="p-5 space-y-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Info size={14} className="text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Breakdown Skor</span>
                    </div>

                    {Object.entries(data.breakdown).map(([key, item]) => {
                        const progress = (item.score / item.max) * 100;
                        let colorClass = "bg-sky-500";
                        if (progress < 40) colorClass = "bg-rose-500";
                        else if (progress < 70) colorClass = "bg-amber-500";
                        else if (progress >= 100) colorClass = "bg-emerald-500";

                        return (
                            <div key={key}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                                    <span className="font-bold text-foreground">{item.score}/{item.max}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
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
