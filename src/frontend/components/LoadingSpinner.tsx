"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    color?: "sky" | "white" | "slate";
    className?: string;
}

export function LoadingSpinner({ size = "md", color = "sky", className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    const colorClasses = {
        sky: "border-sky-200 border-t-sky-500",
        white: "border-white/20 border-t-white",
        slate: "border-slate-200 border-t-sky-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            className={cn("relative", sizeClasses[size], className)}
        >
            <div
                className={cn(
                    "w-full h-full rounded-full border-2 animate-spin",
                    colorClasses[color]
                )}
            />
        </motion.div>
    );
}

interface LoadingDotsProps {
    count?: number;
    color?: string;
    size?: number;
    className?: string;
}

export function LoadingDots({ count = 3, color = "#0ea5e9", size = 8, className }: LoadingDotsProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0.5, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.15,
                    }}
                    className="rounded-full"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: color,
                    }}
                />
            ))}
        </div>
    );
}

interface LoadingBarsProps {
    count?: number;
    className?: string;
}

export function LoadingBars({ count = 4, className }: LoadingBarsProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scaleY: 0.5 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                    }}
                    className="w-1 bg-sky-500 rounded-full"
                    style={{ height: 20 }}
                />
            ))}
        </div>
    );
}

interface FullPageLoadingProps {
    message?: string;
    showLogo?: boolean;
}

export function FullPageLoading({ message = "Loading...", showLogo = true }: FullPageLoadingProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm"
        >
            <div className="text-center">
                {showLogo && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-sky-500/30"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <LoadingSpinner size="lg" color="white" className="w-10 h-10" />
                        </motion.div>
                    </motion.div>
                )}
                
                <LoadingDots count={3} size={10} className="justify-center mb-4" />
                
                {message && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm font-medium text-slate-600 dark:text-slate-400"
                    >
                        {message}
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
}

interface InlineLoadingProps {
    text?: string;
    size?: "sm" | "md";
}

export function InlineLoading({ text, size = "md" }: InlineLoadingProps) {
    return (
        <div className={cn("flex items-center gap-3", size === "sm" ? "text-xs" : "text-sm")}>
            <LoadingBars count={3} />
            {text && <span className="text-slate-600 dark:text-slate-400 font-medium">{text}</span>}
        </div>
    );
}
