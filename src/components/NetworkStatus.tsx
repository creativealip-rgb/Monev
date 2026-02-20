"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { WifiOff } from "lucide-react";

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            // Native: use Capacitor Network plugin
            import("@capacitor/network").then(({ Network }) => {
                Network.addListener("networkStatusChange", (status) => {
                    setIsOnline(status.connected);
                });
                Network.getStatus().then((s) => setIsOnline(s.connected));
            });
        } else {
            // Web fallback
            setIsOnline(navigator.onLine);
            const goOnline = () => setIsOnline(true);
            const goOffline = () => setIsOnline(false);
            window.addEventListener("online", goOnline);
            window.addEventListener("offline", goOffline);
            return () => {
                window.removeEventListener("online", goOnline);
                window.removeEventListener("offline", goOffline);
            };
        }
    }, []);

    useEffect(() => {
        if (!isOnline) {
            setShowBanner(true);
        } else {
            // Delay hiding to show "kembali online" briefly
            const t = setTimeout(() => setShowBanner(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isOnline]);

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
