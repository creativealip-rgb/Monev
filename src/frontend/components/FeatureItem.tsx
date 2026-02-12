"use client";

import { cn } from "@/frontend/lib/utils";
import { motion } from "framer-motion";

interface FeatureItemProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    color?: string;
}

export function FeatureItem({ label, icon, onClick, color = "blue" }: FeatureItemProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _color = color;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-3 group"
        >
            <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                "bg-white border border-slate-100 shadow-sm",
                "group-hover:border-blue-200 group-hover:bg-blue-50/30",
                "group-hover:shadow-lg group-hover:shadow-blue-500/10",
                "group-active:scale-95"
            )}>
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight max-w-[80px] group-hover:text-slate-900 transition-colors">
                {label}
            </span>
        </motion.button>
    );
}
