"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AIInsightWidget } from "./widgets/AIInsightWidget";
import type { AIInsight } from "@/frontend/hooks/useAIInsight";

interface AIInsightSectionProps {
    insight: AIInsight | null;
    loading: boolean;
    onRefresh: () => void;
}

export function AIInsightSection({ insight, loading, onRefresh }: AIInsightSectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="px-4 mb-4 sm:px-6 sm:mb-5"
        >
            {loading ? (
                <div className="flex w-full animate-pulse items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800">
                        <Sparkles size={17} className="text-slate-400" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        </div>
                        <div className="h-2.5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            ) : insight ? (
                <AIInsightWidget
                    insight={insight.insight}
                    type={insight.type}
                    generatedAt={insight.generatedAt}
                    onRefresh={onRefresh}
                />
            ) : null}
        </motion.section>
    );
}
