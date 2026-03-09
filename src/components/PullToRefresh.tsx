"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/frontend/lib/utils";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const pullThreshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow pulling when at the top
        if (window.scrollY === 0) {
            startY.current = e.touches[0].pageY;
            isPulling.current = true;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Apply resistance
            const distance = Math.min(diff * 0.4, 120);
            setPullDistance(distance);

            // Prevent default scroll if pulling down at top
            if (diff > 5) {
                if (e.cancelable) e.preventDefault();
            }
        } else {
            setPullDistance(0);
            isPulling.current = false;
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling.current || isRefreshing) return;
        isPulling.current = false;

        if (pullDistance >= pullThreshold) {
            setIsRefreshing(true);
            setPullDistance(60); // Hold at active position
            try {
                await onRefresh();
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 300);
            }
        } else {
            setPullDistance(0);
        }
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
        >
            {/* Refresh Indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50"
                style={{
                    height: pullDistance,
                    opacity: pullDistance / pullThreshold,
                    overflow: 'hidden',
                    transform: `translateY(${pullDistance > 0 ? 10 : 0}px)`
                }}
            >
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-full p-3 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <motion.div
                        animate={
                            isRefreshing
                                ? { rotate: 360, scale: [1, 1.1, 1] }
                                : {
                                      rotate: (pullDistance / pullThreshold) * 180,
                                      scale: Math.min(1 + pullDistance / 200, 1.3)
                                  }
                        }
                        transition={
                            isRefreshing
                                ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                                : { type: "spring", damping: 20, stiffness: 300 }
                        }
                        className="relative"
                    >
                        <RefreshCw
                            size={24}
                            className={cn(
                                "text-sky-500",
                                isRefreshing && "drop-shadow-lg"
                            )}
                            strokeWidth={2.5}
                        />
                        {/* Progress ring when refreshing */}
                        {isRefreshing && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute inset-0 rounded-full border-2 border-sky-200 border-t-sky-500"
                                style={{ width: 40, height: 40 }}
                            />
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Content Container */}
            <motion.div
                style={{ y: isRefreshing ? 60 : pullDistance }}
                transition={
                    isPulling.current
                        ? { type: "tween", duration: 0 }
                        : isRefreshing
                            ? { type: "spring", damping: 30, stiffness: 400 }
                            : { type: "spring", damping: 25, stiffness: 200 }
                }
            >
                {children}
            </motion.div>
        </div>
    );
}
