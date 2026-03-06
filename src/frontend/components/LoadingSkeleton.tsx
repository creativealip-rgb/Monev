"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "shimmer" | "pulse" | "wave";
}

export function Skeleton({
    className,
    variant = "text",
    width,
    height,
    animation = "shimmer"
}: SkeletonProps) {
    const baseClasses = "bg-slate-200 relative overflow-hidden";

    const variantClasses = {
        text: "rounded h-4",
        circular: "rounded-full",
        rectangular: "rounded-none",
        rounded: "rounded-xl"
    };

    const animationClasses = {
        shimmer: "",
        pulse: "animate-pulse",
        wave: "animate-pulse"
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden",
                variantClasses[variant],
                animationClasses[animation],
                "bg-slate-200/80 dark:bg-slate-800/80",
                className
            )}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height
            }}
        >
            {animation === "shimmer" && (
                <motion.div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent skew-x-[-20deg]"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "linear"
                    }}
                />
            )}
        </div>
    );
}

export function TransactionSkeleton() {
    return (
        <div className="flex items-center p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm backdrop-blur-sm">
            <Skeleton variant="rounded" className="w-11 h-11 rounded-[14px] mr-4" />
            <div className="flex-1 space-y-2.5">
                <Skeleton variant="text" className="w-3/5 h-4 rounded-md" />
                <Skeleton variant="text" className="w-1/3 h-3 rounded-md" />
            </div>
            <div className="flex flex-col items-end space-y-2.5">
                <Skeleton variant="text" className="w-20 h-4 rounded-md" />
            </div>
        </div>
    );
}

export function GoalCardSkeleton() {
    return (
        <div className="p-5 card-clean space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton variant="rounded" className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-2/3 h-4" />
                    <Skeleton variant="text" className="w-1/3 h-3" />
                </div>
            </div>
            <Skeleton variant="rounded" className="w-full h-2" />
            <div className="flex justify-between">
                <Skeleton variant="text" className="w-24 h-4" />
                <Skeleton variant="text" className="w-24 h-4" />
            </div>
        </div>
    );
}

export function BillCardSkeleton() {
    return (
        <div className="p-4 card-clean space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton variant="rounded" className="w-10 h-10" />
                <Skeleton variant="text" className="w-16 h-6" />
            </div>
            <Skeleton variant="text" className="w-2/3 h-4" />
            <div className="flex justify-between items-center">
                <Skeleton variant="text" className="w-20 h-5" />
                <Skeleton variant="rounded" className="w-8 h-8" />
            </div>
        </div>
    );
}

export function BudgetCardSkeleton() {
    return (
        <div className="p-5 card-clean space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton variant="text" className="w-1/3 h-5" />
                <Skeleton variant="rounded" className="w-16 h-8" />
            </div>
            <Skeleton variant="rounded" className="w-full h-3" />
            <div className="flex justify-between">
                <Skeleton variant="text" className="w-24 h-4" />
                <Skeleton variant="text" className="w-24 h-4" />
            </div>
        </div>
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="p-6 rounded-3xl bg-slate-100 space-y-3">
            <Skeleton variant="text" className="w-20 h-3" />
            <Skeleton variant="text" className="w-32 h-8" />
            <Skeleton variant="rounded" className="w-full h-2" />
        </div>
    );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <TransactionSkeleton />
                </motion.div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            <div className="px-6 pt-safe pt-5 space-y-6">
                {/* Header Profile Area */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-11 h-11 border-2 border-white dark:border-slate-800 shadow-sm" />
                        <div className="space-y-2">
                            <Skeleton variant="text" className="w-20 h-3" />
                            <Skeleton variant="text" className="w-32 h-4" />
                        </div>
                    </div>
                    <Skeleton variant="circular" className="w-9 h-9" />
                </div>

                {/* Main Balance Card Skeleton */}
                <div className="rounded-[32px] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-8 space-y-5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 dark:bg-white/5 rounded-full blur-3xl" />
                    <Skeleton variant="text" className="w-28 h-3 bg-slate-300 dark:bg-slate-700" />
                    <Skeleton variant="text" className="w-56 h-10 bg-slate-300 dark:bg-slate-700" />

                    <div className="flex gap-4 pt-2">
                        <Skeleton variant="rounded" className="flex-1 h-20 bg-slate-300/50 dark:bg-slate-700/50 rounded-2xl" />
                        <Skeleton variant="rounded" className="flex-1 h-20 bg-slate-300/50 dark:bg-slate-700/50 rounded-2xl" />
                    </div>
                </div>

                {/* Quick Actions / Feature Grid Skeleton */}
                <div className="grid grid-cols-4 gap-4 py-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="text-center space-y-3 flex flex-col items-center">
                            <Skeleton variant="rounded" className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-slate-800/60 shadow-sm" />
                            <Skeleton variant="text" className="w-14 h-2.5 mx-auto" />
                        </div>
                    ))}
                </div>

                {/* Transactions Skeleton */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <Skeleton variant="text" className="w-32 h-4" />
                        <Skeleton variant="text" className="w-16 h-3" />
                    </div>
                    <TransactionListSkeleton count={4} />
                </div>
            </div>
        </div>
    );
}
