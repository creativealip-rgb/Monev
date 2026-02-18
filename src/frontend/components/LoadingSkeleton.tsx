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
                baseClasses,
                variantClasses[variant],
                animationClasses[animation],
                className
            )}
            style={{
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height
            }}
        >
            {animation === "shimmer" && (
                <motion.div
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    animate={{ translateX: ["-100%", "200%"] }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut"
                    }}
                />
            )}
        </div>
    );
}

export function TransactionSkeleton() {
    return (
        <div className="flex items-center p-4 card-clean">
            <Skeleton variant="rounded" className="w-12 h-12 mr-4" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-3/4 h-4" />
                <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
            <Skeleton variant="text" className="w-20 h-5" />
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
        <div className="min-h-screen pb-24">
            <div className="px-6 pt-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-10 h-10" />
                        <div className="space-y-2">
                            <Skeleton variant="text" className="w-16 h-3" />
                            <Skeleton variant="text" className="w-24 h-4" />
                        </div>
                    </div>
                    <Skeleton variant="circular" className="w-8 h-8" />
                </div>

                <div className="rounded-[32px] bg-slate-200 p-8 space-y-4">
                    <Skeleton variant="text" className="w-24 h-3" />
                    <Skeleton variant="text" className="w-48 h-10" />
                    <div className="flex gap-3">
                        <Skeleton variant="rounded" className="flex-1 h-20" />
                        <Skeleton variant="rounded" className="flex-1 h-20" />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="text-center space-y-2">
                            <Skeleton variant="rounded" className="w-12 h-12 mx-auto" />
                            <Skeleton variant="text" className="w-12 h-3 mx-auto" />
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <Skeleton variant="text" className="w-32 h-4" />
                    <TransactionListSkeleton count={3} />
                </div>
            </div>
        </div>
    );
}
