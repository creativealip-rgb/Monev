"use client";

const CACHE_KEY = "monev-prediction-cache";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

interface CacheItem {
    category: string;
    timestamp: number;
}

export const CacheManager = {
    getCategory(merchantName: string): string | null {
        if (typeof window === "undefined") return null;
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        if (!cacheRaw) return null;

        const cache: Record<string, CacheItem> = JSON.parse(cacheRaw);
        const item = cache[merchantName.toLowerCase()];

        if (item && (Date.now() - item.timestamp < CACHE_TTL)) {
            return item.category;
        }

        return null;
    },

    setCategory(merchantName: string, category: string) {
        if (typeof window === "undefined") return;
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        const cache: Record<string, CacheItem> = cacheRaw ? JSON.parse(cacheRaw) : {};

        cache[merchantName.toLowerCase()] = {
            category,
            timestamp: Date.now()
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    },

    clearOldCache() {
        if (typeof window === "undefined") return;
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        if (!cacheRaw) return;

        const cache: Record<string, CacheItem> = JSON.parse(cacheRaw);
        const filtered: Record<string, CacheItem> = {};

        Object.entries(cache).forEach(([key, item]) => {
            if (Date.now() - item.timestamp < CACHE_TTL) {
                filtered[key] = item;
            }
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    }
};
