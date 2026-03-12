"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/frontend/lib/api-client";

export interface AIInsight {
    insight: string;
    type: "success" | "warning" | "info";
    generatedAt?: string;
    isCached?: boolean;
    isStale?: boolean;
}

export function useAIInsight(year?: number, month?: number, locale?: string) {
    const [insight, setInsight] = useState<AIInsight | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsight = useCallback(async (refresh = false) => {
        try {
            setLoading(true);
            setError(null);
            
            const now = new Date();
            const y = year || now.getFullYear();
            const m = month || (now.getMonth() + 1);
            
            const params = new URLSearchParams({
                year: y.toString(),
                month: m.toString(),
                refresh: refresh.toString(),
                locale: locale || "id"
            });
            
            const res = await apiFetch(`/api/ai/insight?${params}`);
            const data = await res.json();
            
            if (data.success) {
                setInsight(data);
            } else {
                setError(data.error || "Gagal mengambil insight");
            }
        } catch (err) {
            setError("Gagal mengambil insight");
            console.error("AI Insight error:", err);
        } finally {
            setLoading(false);
        }
    }, [year, month, locale]);

    useEffect(() => {
        fetchInsight();

        const refreshInterval = setInterval(() => {
            if (insight?.generatedAt) {
                const generatedTime = new Date(insight.generatedAt).getTime();
                const sixHours = 6 * 60 * 60 * 1000;
                const now = Date.now();
                
                if (now - generatedTime >= sixHours) {
                    fetchInsight(true);
                }
            }
        }, 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [fetchInsight, insight]);

    const refresh = useCallback(() => {
        return fetchInsight(true);
    }, [fetchInsight]);

    return { insight, loading, error, refresh };
}
