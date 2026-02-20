export type UserTier = "miskin" | "kaya" | "sultan";

export interface TierConfig {
    name: string;
    maxGoals: number;
    maxCategories: number;
    aiDailyLimit: number | null; // null means unlimited
    analyticsLevel: "basic" | "full" | "advanced";
    exportFormats: string[];
    adFree: boolean;
    features: string[];
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
    miskin: {
        name: "Miskin",
        maxGoals: 1,
        maxCategories: 5,
        aiDailyLimit: 3,
        analyticsLevel: "basic",
        exportFormats: [],
        adFree: false,
        features: ["Catat Transaksi", "Dasbor Dasar"],
    },
    kaya: {
        name: "Kaya",
        maxGoals: 10,
        maxCategories: 100,
        aiDailyLimit: null,
        analyticsLevel: "full",
        exportFormats: ["CSV", "Excel"],
        adFree: true,
        features: ["Semua di Miskin", "Tanpa Batas Transaksi", "Manajer Anggaran", "Export CSV/Excel"],
    },
    sultan: {
        name: "Sultan",
        maxGoals: 1000,
        maxCategories: 1000,
        aiDailyLimit: null,
        analyticsLevel: "advanced",
        exportFormats: ["CSV", "Excel", "PDF"],
        adFree: true,
        features: ["Semua di Kaya", "Wawasan AI Prioritas", "Laporan PDF Custom", "Support 24/7"],
    },
};

export function getTierConfig(tier: UserTier = "miskin"): TierConfig {
    return TIER_CONFIGS[tier] || TIER_CONFIGS.miskin;
}

export function canCreateGoal(currentCount: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxGoals;
}

export function canUseAI(currentUsageToday: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    if (config.aiDailyLimit === null) return true;
    return currentUsageToday < config.aiDailyLimit;
}

export function hasFullAnalytics(tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    return config.analyticsLevel === "full" || config.analyticsLevel === "advanced";
}

export function canUseTelegram(tier: UserTier = "miskin"): boolean {
    return tier === "sultan";
}
