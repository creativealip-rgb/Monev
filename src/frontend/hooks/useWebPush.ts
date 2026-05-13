"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WebPush");

/**
 * Web Push Notification registration hook.
 * Registers the push service worker and subscribes to push notifications.
 * 
 * Usage:
 * ```tsx
 * const { isSupported, isSubscribed, subscribe, unsubscribe } = useWebPush();
 * ```
 */
export function useWebPush() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            checkSubscription();
            return;
        }

        setIsSupported(false);
        setIsLoading(false);
    }, []);

    async function checkSubscription() {
        setIsLoading(true);
        try {
            const reg = await navigator.serviceWorker.register("/push-sw.js");
            setRegistration(reg);

            const sub = await reg.pushManager.getSubscription();
            setIsSubscribed(!!sub);
        } catch (error) {
            logger.error("Registration failed", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function subscribe(): Promise<boolean> {
        if (!registration) return false;
        setIsLoading(true);

        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setIsLoading(false);
                return false;
            }

            // Get VAPID key from server
            const res = await apiFetch("/api/push/vapid-key");
            if (!res.ok) {
                logger.error("Failed to get VAPID key");
                setIsLoading(false);
                return false;
            }
            const { publicKey } = await res.json();

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
            });

            // Send subscription to server
            await apiFetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription),
            });

            setIsSubscribed(true);
            return true;
        } catch (error) {
            logger.error("Subscribe failed", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }

    async function unsubscribe(): Promise<boolean> {
        if (!registration) return false;
        setIsLoading(true);

        try {
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                await apiFetch("/api/push/unsubscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
            }
            setIsSubscribed(false);
            return true;
        } catch (error) {
            logger.error("Unsubscribe failed", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }

    return { isSupported, isSubscribed, subscribe, unsubscribe, isLoading };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
