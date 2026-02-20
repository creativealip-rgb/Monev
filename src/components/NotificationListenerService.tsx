"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * NotificationListenerService
 * 
 * Listens for device notifications (Android only) from banking and e-commerce apps.
 * Parses transaction amounts and descriptions, then auto-logs them as transactions.
 * 
 * Supported patterns:
 * - BCA, BRI, Mandiri, BNI notifications
 * - GoPay, OVO, Dana, ShopeePay
 * - Tokopedia, Shopee, Grab, Gojek
 */

// Regex patterns to extract transaction data from notification text
const TRANSACTION_PATTERNS = [
    // Bank transfers: "Transfer sebesar Rp 500.000 ke ..."
    { regex: /(?:transfer|kirim|debit|bayar|pembayaran)\s*(?:sebesar\s*)?(?:rp\.?\s*)([\d.,]+)/i, type: "expense" as const },
    // Incoming: "Terima transfer Rp 1.000.000 dari ..."
    { regex: /(?:terima|masuk|credit|kredit)\s*(?:transfer\s*)?(?:sebesar\s*)?(?:rp\.?\s*)([\d.,]+)/i, type: "income" as const },
    // E-wallet: "Pembayaran Rp50.000 di Merchant"
    { regex: /(?:pembayaran|payment)\s*(?:rp\.?\s*)([\d.,]+)\s*(?:di|ke|at)\s*(.+)/i, type: "expense" as const },
    // Top-up: "Top up Rp100.000 berhasil"
    { regex: /(?:top\s*up)\s*(?:rp\.?\s*)([\d.,]+)/i, type: "expense" as const },
];

// Apps we care about
const MONITORED_APPS = [
    "com.bca", "id.co.bri", "id.co.mandiri", "com.bni",
    "com.gojek", "com.grabtaxi", "id.dana", "com.ovo",
    "com.shopee", "com.tokopedia",
];

function parseAmount(amountStr: string): number {
    // "500.000,00" → 500000, "50.000" → 50000
    return Math.round(
        Number(amountStr.replace(/\./g, "").replace(",", "."))
    );
}

function parseNotification(text: string, appPackage?: string): { amount: number; description: string; type: "expense" | "income" } | null {
    if (!text) return null;

    for (const pattern of TRANSACTION_PATTERNS) {
        const match = text.match(pattern.regex);
        if (match) {
            const amount = parseAmount(match[1]);
            if (amount > 0 && amount < 100000000) { // sanity check: max 100jt
                const description = match[2]?.trim() || text.substring(0, 60);
                return { amount, description, type: pattern.type };
            }
        }
    }
    return null;
}

export function NotificationListenerService() {
    const processedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const platform = Capacitor.getPlatform();
        if (platform !== "android") return;

        let cleanup: (() => void) | undefined;

        async function initListener() {
            try {
                // Dynamic import to avoid errors on web
                const { NotificationsListener } = await import("capacitor-notifications-listener");

                // Request permission
                const permResult = await NotificationsListener.requestPermission() as any;
                if (permResult && permResult.granted === false) {
                    console.log("[NotificationListener] Permission not granted");
                    return;
                }

                // Start listening
                await NotificationsListener.startListening({} as any);
                console.log("[NotificationListener] Started listening for notifications");

                // Add listener for new notifications
                const listener = await (NotificationsListener as any).addListener(
                    "notificationReceivedEvent",
                    async (notification: { title?: string; body?: string; package?: string }) => {
                        const { title, body, package: pkg } = notification;
                        const text = `${title || ""} ${body || ""}`.trim();

                        // Only process from monitored apps
                        if (pkg && !MONITORED_APPS.some(app => pkg.includes(app))) return;

                        // De-duplicate (same text within 30 seconds)
                        const dedupKey = `${text}_${Math.floor(Date.now() / 30000)}`;
                        if (processedRef.current.has(dedupKey)) return;
                        processedRef.current.add(dedupKey);

                        // Keep set manageable
                        if (processedRef.current.size > 100) {
                            const arr = Array.from(processedRef.current);
                            processedRef.current = new Set(arr.slice(-50));
                        }

                        const parsed = parseNotification(text, pkg);
                        if (!parsed) return;

                        console.log("[NotificationListener] Detected transaction:", parsed);

                        // Send to API
                        try {
                            await fetch("/api/notification-webhook", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    amount: parsed.amount,
                                    description: parsed.description,
                                    type: parsed.type,
                                    source: "notification",
                                    appPackage: pkg,
                                }),
                            });
                        } catch (error) {
                            console.error("[NotificationListener] Failed to save:", error);
                        }
                    }
                );

                cleanup = () => {
                    listener.remove();
                    NotificationsListener.stopListening();
                };
            } catch (error) {
                console.log("[NotificationListener] Not available:", error);
            }
        }

        initListener();

        return () => {
            cleanup?.();
        };
    }, []);

    return null; // Invisible service component
}
