"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface TabOption {
    id: string;
    label: string;
}

interface AnalyticsTabsProps {
    tabs: TabOption[];
    activeTab: string;
    onChange: (id: string) => void;
}

export function AnalyticsTabs({ tabs, activeTab, onChange }: AnalyticsTabsProps) {
    return (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "flex-1 relative py-2 text-xs font-bold rounded-lg transition-colors z-10",
                        activeTab === tab.id
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm z-[-1]"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
