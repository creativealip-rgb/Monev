"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface SkeletonProps {
    className?: string;
    animation?: "pulse" | "shine" | "wave";
}

export function Skeleton({ className, animation = "pulse" }: SkeletonProps) {
    return (
        <div
            className={cn(
                "bg-slate-200 dark:bg-slate-700 rounded-lg",
                animation === "pulse" && "animate-pulse",
                animation === "shine" && "animate-shimmer",
                animation === "wave" && "animate-wave",
                className
            )}
        />
    );
}

interface CardSkeletonProps {
    className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800", className)}
        >
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="w-48 h-10 mb-6" />
            <div className="flex gap-3">
                <Skeleton className="flex-1 h-20 rounded-xl" />
                <Skeleton className="flex-1 h-20 rounded-xl" />
            </div>
        </motion.div>
    );
}

interface ListSkeletonProps {
    count?: number;
    className?: string;
}

export function ListSkeleton({ count = 5, className }: ListSkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="w-3/4 h-4" />
                        <Skeleton className="w-1/2 h-3" />
                    </div>
                    <Skeleton className="w-20 h-6" />
                </motion.div>
            ))}
        </div>
    );
}

interface StatsSkeletonProps {
    className?: string;
}

export function StatsSkeleton({ className }: StatsSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl", className)}
        >
            <Skeleton className="w-24 h-3 mb-2 bg-white/20" />
            <Skeleton className="w-56 h-10 mb-4 bg-white/30" />
            <div className="flex gap-6">
                <div>
                    <Skeleton className="w-20 h-3 mb-1 bg-white/20" />
                    <Skeleton className="w-16 h-6 bg-white/30" />
                </div>
                <div>
                    <Skeleton className="w-24 h-3 mb-1 bg-white/20" />
                    <Skeleton className="w-20 h-6 bg-white/30" />
                </div>
            </div>
        </motion.div>
    );
}

interface FeatureGridSkeletonProps {
    count?: number;
}

export function FeatureGridSkeleton({ count = 9 }: FeatureGridSkeletonProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                    <Skeleton className="w-10 h-10 rounded-xl mx-auto mb-3" />
                    <Skeleton className="w-16 h-3 mx-auto" />
                </motion.div>
            ))}
        </div>
    );
}

// Custom shimmer animation styles
const shimmerStyles = `
@keyframes shimmer {
    0% {
        background-position: -1000px 0;
    }
    100% {
        background-position: 1000px 0;
    }
}

.animate-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(
        90deg,
        #e2e8f0 0%,
        #f1f5f9 20%,
        #e2e8f0 40%,
        #e2e8f0 100%
    );
    background-size: 1000px 100%;
}

.dark .animate-shimmer {
    background: linear-gradient(
        90deg,
        #334155 0%,
        #475569 20%,
        #334155 40%,
        #334155 100%
    );
}

@keyframes wave {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.animate-wave {
    animation: wave 1.5s infinite ease-in-out;
}
`;

// Inject styles
if (typeof document !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = shimmerStyles;
    document.head.appendChild(styleSheet);
}
