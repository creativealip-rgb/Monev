"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Hook for native haptic feedback.
 * No-ops on web platform.
 */
export function useHaptics() {
    const isNative = Capacitor.isNativePlatform();

    const tap = async () => {
        if (!isNative) return;
        try {
            const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch { }
    };

    const medium = async () => {
        if (!isNative) return;
        try {
            const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch { }
    };

    const success = async () => {
        if (!isNative) return;
        try {
            const { Haptics, NotificationType } = await import("@capacitor/haptics");
            await Haptics.notification({ type: NotificationType.Success });
        } catch { }
    };

    const error = async () => {
        if (!isNative) return;
        try {
            const { Haptics, NotificationType } = await import("@capacitor/haptics");
            await Haptics.notification({ type: NotificationType.Error });
        } catch { }
    };

    return { tap, medium, success, error };
}
