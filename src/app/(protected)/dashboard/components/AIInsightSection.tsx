"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
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
            className="px-6 mb-8"
        >
            {loading ? (
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
