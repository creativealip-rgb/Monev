"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Loader2 } from "lucide-react";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { cn } from "@/frontend/lib/utils";

export function OfflineBadge() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const checkPending = async () => {
        const queue = await OfflineManager.getQueue();
        setPendingCount(queue.length);
    };

    useEffect(() => {
        // Initial check
        checkPending();
        setIsOnline(navigator.onLine);

        const handleOnline = async () => {
            setIsOnline(true);
            setIsSyncing(true);
            await OfflineManager.syncQueue();
            await checkPending();
            setIsSyncing(false);
        };

        const handleOffline = () => setIsOnline(false);
        const handleQueueChange = () => checkPending();

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        window.addEventListener("offline-queue-changed", handleQueueChange);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("offline-queue-changed", handleQueueChange);
        };
    }, []);

    if (pendingCount === 0 && isOnline) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                    "fixed top-safe top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg border border-white/10 backdrop-blur-md flex items-center gap-2",
                    isOnline
                        ? "bg-sky-500/90 text-white"
                        : "bg-rose-500/90 text-white"
                )}
            >
                {isOnline ? (
                    isSyncing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-xs font-bold">Sinkronisasi {pendingCount} data...</span>
                        </>
                    ) : (
                        <>
                            <WifiOff size={16} />
                            <span className="text-xs font-bold">{pendingCount} Menunggu Sinkronisasi</span>
                        </>
                    )
                ) : (
                    <>
                        <WifiOff size={16} />
                        <span className="text-xs font-bold">Offline ({pendingCount} pending)</span>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
