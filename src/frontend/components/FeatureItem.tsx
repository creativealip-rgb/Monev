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
    purple: { bg: "bg-purple-500/10 backdrop-blur-md border-purple-200/30", text: "text-purple-600", hoverBg: "group-hover:bg-purple-500/20", hoverBorder: "group-hover:border-purple-300/50" },
    blue: { bg: "bg-blue-500/10 backdrop-blur-md border-blue-200/30", text: "text-blue-600", hoverBg: "group-hover:bg-blue-500/20", hoverBorder: "group-hover:border-blue-300/50" },
    emerald: { bg: "bg-emerald-500/10 backdrop-blur-md border-emerald-200/30", text: "text-emerald-600", hoverBg: "group-hover:bg-emerald-500/20", hoverBorder: "group-hover:border-emerald-300/50" },
    rose: { bg: "bg-rose-500/10 backdrop-blur-md border-rose-200/30", text: "text-rose-600", hoverBg: "group-hover:bg-rose-500/20", hoverBorder: "group-hover:border-rose-300/50" },
    amber: { bg: "bg-amber-500/10 backdrop-blur-md border-amber-200/30", text: "text-amber-600", hoverBg: "group-hover:bg-amber-500/20", hoverBorder: "group-hover:border-amber-300/50" },
    indigo: { bg: "bg-indigo-500/10 backdrop-blur-md border-indigo-200/30", text: "text-indigo-600", hoverBg: "group-hover:bg-indigo-500/20", hoverBorder: "group-hover:border-indigo-300/50" },
};

export function FeatureItem({ label, icon, onClick, color = "blue" }: FeatureItemProps) {
    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-3 group"
        >
            <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                "border shadow-sm",
                colors.bg,
                colors.hoverBg,
                colors.hoverBorder,
                "group-hover:shadow-lg",
                "group-active:scale-95"
            )}>
                <div className={cn("transform group-hover:scale-110 transition-transform duration-300", colors.text)}>
                    {icon}
                </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight max-w-[80px] group-hover:text-slate-900 transition-colors">
                {label}
            </span>
        </motion.button>
    );
}
