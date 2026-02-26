"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { useToast } from "@/frontend/components/Toast";
import { useNetworkStatus } from "@/frontend/hooks/useNetworkStatus";

export function NetworkStatus() {
    const { isOnline } = useNetworkStatus();
    const [showBanner, setShowBanner] = useState(false);
    const { success } = useToast();

    useEffect(() => {
        if (!isOnline) {
            setShowBanner(true);
        } else {
            // Trigger sync when back online
            (async () => {
                const hasPending = await OfflineManager.hasPendingItems();
                if (hasPending) {
                    const res = await OfflineManager.syncQueue();
                    if (res.success > 0) {
                        success(`${res.success} transaksi tersinkronasi!`);
                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                    }
                }
            })();
            // Delay hiding to show "kembali online" briefly
            const t = setTimeout(() => setShowBanner(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isOnline, success]);

    if (!showBanner) return null;

    return (
        <div
            className={`fixed top-0 inset-x-0 z-[99999] text-center text-xs font-semibold py-2 transition-colors duration-300 ${isOnline
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
                }`}
            style={{ paddingTop: `calc(var(--safe-area-top) + 8px)` }}
        >
            {isOnline ? (
                "✓ Kembali online"
            ) : (
                <span className="flex items-center justify-center gap-1.5">
                    <WifiOff size={14} />
                    Tidak ada koneksi internet
                </span>
            )}
        </div>
    );
}
