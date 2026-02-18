"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useTheme } from "@/frontend/lib/theme-context";

export function ThemeToggle({ className }: { className?: string }) {
    const { toggleTheme, isDark } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                "bg-slate-100 dark:bg-slate-800",
                "hover:bg-slate-200 dark:hover:bg-slate-700",
                "border border-slate-200 dark:border-slate-700",
                className
            )}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <motion.div
                initial={false}
                animate={{
                    rotate: isDark ? 360 : 0,
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                {isDark ? (
                    <Moon size={22} className="text-amber-400" />
                ) : (
                    <Sun size={22} className="text-amber-500" />
                )}
            </motion.div>
            
            <motion.div
                initial={false}
                animate={{ opacity: isDark ? 1 : 0 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10"
            />
        </motion.button>
    );
}

export function ThemeToggleSegment({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();

    const options: { id: "light" | "dark"; label: string; icon: typeof Sun }[] = [
        { id: "light", label: "Light", icon: Sun },
        { id: "dark", label: "Dark", icon: Moon },
    ];

    return (
        <div className={cn(
            "flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800",
            className
        )}>
            {options.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.id;
                
                return (
                    <button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            isActive
                                ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        )}
                    >
                        <Icon size={14} />
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function ThemeToggleSwitch({ className }: { className?: string }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative w-14 h-7 rounded-full transition-colors",
                isDark ? "bg-sky-600" : "bg-slate-300",
                className
            )}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <motion.div
                initial={false}
                animate={{
                    x: isDark ? 28 : 4,
                    rotate: isDark ? 360 : 0
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
            >
                {isDark ? (
                    <Moon size={12} className="text-sky-600" />
                ) : (
                    <Sun size={12} className="text-amber-500" />
                )}
            </motion.div>
        </button>
    );
}
