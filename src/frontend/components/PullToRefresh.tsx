"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const pullDistance = useMotionValue(0);
    const opacity = useTransform(pullDistance, [0, 80], [0, 1]);
    const scale = useTransform(pullDistance, [0, 80], [0.5, 1]);
    const rotate = useTransform(pullDistance, [0, 80], [0, 360]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;
        
        const container = containerRef.current;
        if (container && container.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || disabled || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        
        if (diff > 0) {
            const distance = Math.min(diff * 0.5, 100);
            pullDistance.set(distance);
        }
    }, [disabled, isRefreshing, pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current || disabled || isRefreshing) return;

        isPulling.current = false;
        
        const distance = pullDistance.get();
        
        if (distance >= 80) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
            }
        }
        
        pullDistance.set(0);
    }, [disabled, isRefreshing, pullDistance, onRefresh]);

    return (
        <div
            ref={containerRef}
            className="relative overflow-y-auto h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <motion.div
                style={{ opacity, scale }}
                className="absolute top-0 left-0 right-0 flex justify-center py-4 pointer-events-none z-50"
            >
                <motion.div
                    style={{ rotate: isRefreshing ? undefined : rotate }}
                    animate={isRefreshing ? { rotate: 360 } : undefined}
                    transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : undefined}
                    className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30"
                >
                    <Loader2 className="w-5 h-5 text-white" />
                </motion.div>
            </motion.div>

            <motion.div
                style={{ y: useTransform(pullDistance, (v) => v * 0.5) }}
            >
                {children}
            </motion.div>
        </div>
    );
}
