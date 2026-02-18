"use client";

import { cn } from "@/frontend/lib/utils";
import { motion } from "framer-motion";

interface FeatureItemProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    color?: string;
}

const colorClasses: Record<string, { bg: string; text: string; hoverBg: string; hoverBorder: string }> = {
    purple: { bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-500 dark:text-purple-400", hoverBg: "group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50", hoverBorder: "group-hover:border-purple-200 dark:group-hover:border-purple-700" },
    sky: { bg: "bg-sky-50 dark:bg-sky-900/30", text: "text-sky-500 dark:text-sky-400", hoverBg: "group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50", hoverBorder: "group-hover:border-sky-200 dark:group-hover:border-sky-700" },
    blue: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-500 dark:text-blue-400", hoverBg: "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50", hoverBorder: "group-hover:border-blue-200 dark:group-hover:border-blue-700" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-500 dark:text-emerald-400", hoverBg: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50", hoverBorder: "group-hover:border-emerald-200 dark:group-hover:border-emerald-700" },
    rose: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-500 dark:text-rose-400", hoverBg: "group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50", hoverBorder: "group-hover:border-rose-200 dark:group-hover:border-rose-700" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-500 dark:text-amber-400", hoverBg: "group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50", hoverBorder: "group-hover:border-amber-200 dark:group-hover:border-amber-700" },
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-500 dark:text-indigo-400", hoverBg: "group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50", hoverBorder: "group-hover:border-indigo-200 dark:group-hover:border-indigo-700" },
    orange: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-500 dark:text-orange-400", hoverBg: "group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50", hoverBorder: "group-hover:border-orange-200 dark:group-hover:border-orange-700" },
};

export function FeatureItem({ label, icon, onClick, color = "blue" }: FeatureItemProps) {
    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-3 group cursor-pointer"
        >
            <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                "border border-transparent shadow-sm",
                colors.bg,
                colors.hoverBg,
                colors.hoverBorder,
                "group-hover:shadow-md",
                "group-active:scale-90"
            )}>
                <div className={cn("transform transition-transform duration-300 group-hover:scale-110", colors.text)}>
                    {icon}
                </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight max-w-[80px] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {label}
            </span>
        </motion.div>
    );
}
