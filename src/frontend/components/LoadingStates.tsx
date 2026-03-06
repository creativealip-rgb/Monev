"use client";

import React from "react";

/**
 * Loading Spinner Component
 * Accessible loading indicator with screen reader support
 */
interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    label?: string;
    className?: string;
}

export function LoadingSpinner({ size = "md", label = "Memuat...", className = "" }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2" role="status" aria-label={label}>
            <div
                className={`${sizeClasses[size]} border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin ${className}`}
                aria-hidden="true"
            />
            <span className="sr-only">{label}</span>
        </div>
    );
}

/**
 * Page Loading State
 * Full-page loading indicator
 */
export function PageLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-slate-600 dark:text-slate-400 animate-pulse">
                    Memuat data...
                </p>
            </div>
        </div>
    );
}

/**
 * Inline Loading Text
 * Small loading indicator for buttons and inline actions
 */
interface InlineLoadingProps {
    text?: string;
    size?: "sm" | "md";
}

export function InlineLoading({ text = "Menyimpan...", size = "sm" }: InlineLoadingProps) {
    const sizeClasses = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
    };

    return (
        <span className="inline-flex items-center gap-2" role="status">
            <div
                className={`${sizeClasses[size]} border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin`}
                aria-hidden="true"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
        </span>
    );
}

/**
 * Content Placeholder
 * Gray placeholder for content that's loading
 */
interface ContentPlaceholderProps {
    lines?: number;
    className?: string;
}

export function ContentPlaceholder({ lines = 3, className = "" }: ContentPlaceholderProps) {
    return (
        <div className={`space-y-3 ${className}`} role="status" aria-label="Memuat konten">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
                    style={{ width: `${100 - (i * 10)}%` }}
                />
            ))}
            <span className="sr-only">Memuat konten...</span>
        </div>
    );
}

/**
 * Card Loading State
 * Skeleton loader for card components
 */
export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
        </div>
    );
}

/**
 * List Loading State
 * Skeleton loader for list items
 */
interface ListSkeletonProps {
    count?: number;
    variant?: "compact" | "detailed";
}

export function ListSkeleton({ count = 5, variant = "compact" }: ListSkeletonProps) {
    return (
        <div className="space-y-3" role="status" aria-label="Memuat daftar">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 animate-pulse"
                >
                    {variant === "detailed" ? (
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                            </div>
                            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                            </div>
                            <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    )}
                </div>
            ))}
            <span className="sr-only">Memuat {count} item...</span>
        </div>
    );
}

/**
 * Dashboard Loading State
 * Complete dashboard skeleton
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 p-4" role="status" aria-label="Memuat dasbor">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-sky-500 to-cyan-600 rounded-3xl p-6 animate-pulse">
                <div className="h-4 bg-white/20 rounded w-24 mb-2" />
                <div className="h-10 bg-white/20 rounded w-3/4 mb-4" />
                <div className="flex gap-4">
                    <div className="h-8 bg-white/20 rounded w-24" />
                    <div className="h-8 bg-white/20 rounded w-24" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 animate-pulse">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                ))}
            </div>

            {/* Recent Transactions */}
            <div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-3" />
                <ListSkeleton count={3} variant="detailed" />
            </div>

            <span className="sr-only">Memuat dasbor...</span>
        </div>
    );
}
