"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { normalizeViewMode, type ViewMode } from "@/frontend/lib/navigation-menu";

export function useViewMode() {
    const [viewMode, setViewModeState] = useState<ViewMode>("advanced");
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const response = await apiFetch("/api/user/settings");
            const result = await response.json();
            setViewModeState(normalizeViewMode(result.settings?.viewMode));
        } catch (error) {
            console.error("Gagal memuat mode tampilan", error);
            setViewModeState("advanced");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const setViewMode = useCallback(async (mode: ViewMode) => {
        setViewModeState(mode);
        window.dispatchEvent(new CustomEvent("monev:view-mode-changed", { detail: mode }));

        const response = await apiFetch("/api/user/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ viewMode: mode }),
        });

        if (!response.ok) {
            await refresh();
            throw new Error("Gagal menyimpan mode tampilan");
        }
    }, [refresh]);

    useEffect(() => {
        const onViewModeChanged = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            setViewModeState(normalizeViewMode(detail));
        };

        window.addEventListener("monev:view-mode-changed", onViewModeChanged);
        return () => window.removeEventListener("monev:view-mode-changed", onViewModeChanged);
    }, []);

    return {
        viewMode,
        isSimpleMode: viewMode === "simple",
        isAdvancedMode: viewMode === "advanced",
        loading,
        setViewMode,
        refresh,
    };
}
