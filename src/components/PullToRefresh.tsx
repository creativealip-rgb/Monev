"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-full p-2 flex items-center justify-center">
                    <motion.div
                        animate={isRefreshing ? { rotate: 360 } : { rotate: (pullDistance / pullThreshold) * 180 }}
                        transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring", damping: 20 }}
                    >
                        <RefreshCw size={20} className="text-sky-500" />
                    </motion.div>
                </div>
            </div>

            {/* Content Container */}
            <motion.div
                style={{ y: isRefreshing ? 60 : pullDistance }}
                transition={isPulling.current ? { type: "tween", duration: 0 } : { type: "spring", damping: 25, stiffness: 200 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
