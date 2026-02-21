export type UserTier = "miskin" | "kaya" | "sultan";

export interface TierConfig {
    name: string;
    maxGoals: number;
    maxCategories: number;
    maxTransactionsPerMonth: number | null; // null = unlimited
    maxBudgets: number;
    maxBills: number;
    maxInvestments: number;
    aiDailyLimit: number | null; // null = unlimited
    analyticsLevel: "basic" | "full" | "advanced";
    exportFormats: string[];
    adFree: boolean;
    canAccessAnalytics: boolean;
    canAccessInvestments: boolean;
    canAccessSmartInput: boolean;
    canAccessSmartAgents: boolean;
    canExport: boolean;
    features: string[];
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
    miskin: {
        name: "Miskin",
        maxGoals: 1,
        maxCategories: 5,
        maxTransactionsPerMonth: 50,
        maxBudgets: 2,
        maxBills: 3,
        maxInvestments: 0,
        aiDailyLimit: 3,
        analyticsLevel: "basic",
        exportFormats: [],
        adFree: false,
        canAccessAnalytics: true,
        canAccessInvestments: false,
        canAccessSmartInput: false,
        canAccessSmartAgents: false,
        canExport: false,
        features: ["Catat Transaksi (50/bln)", "Dasbor Dasar", "2 Anggaran", "1 Target Tabungan", "3 Tagihan"],
    },
    kaya: {
        name: "Kaya",
        maxGoals: 10,
        maxCategories: 100,
        maxTransactionsPerMonth: null,
        maxBudgets: 10,
        maxBills: 20,
        maxInvestments: 5,
        aiDailyLimit: null,
        analyticsLevel: "full",
        exportFormats: ["CSV", "Excel"],
        adFree: true,
        canAccessAnalytics: true,
        canAccessInvestments: true,
        canAccessSmartInput: true,
        canAccessSmartAgents: true,
        canExport: true,
        features: ["Transaksi Unlimited", "Full Analisa", "Smart Input", "10 Anggaran", "Export CSV/Excel"],
    },
    sultan: {
        name: "Sultan",
        maxGoals: 1000,
        maxCategories: 1000,
        maxTransactionsPerMonth: null,
        maxBudgets: 1000,
        maxBills: 1000,
        maxInvestments: 1000,
        aiDailyLimit: null,
        analyticsLevel: "advanced",
        exportFormats: ["CSV", "Excel", "PDF"],
        adFree: true,
        canAccessAnalytics: true,
        canAccessInvestments: true,
        canAccessSmartInput: true,
        canAccessSmartAgents: true,
        canExport: true,
        features: ["Semua di Kaya", "Telegram Bot", "Wawasan AI Prioritas", "Laporan PDF Custom", "Support 24/7"],
    },
};

// Tier hierarchy for comparison
const TIER_LEVELS: Record<UserTier, number> = {
    miskin: 0,
    kaya: 1,
    sultan: 2,
};

export function getTierConfig(tier: UserTier = "miskin"): TierConfig {
    return TIER_CONFIGS[tier] || TIER_CONFIGS.miskin;
}

export function isTierSufficient(userTier: UserTier, requiredTier: UserTier): boolean {
    return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
}

export function canCreateGoal(currentCount: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxGoals;
}

export function canCreateBudget(currentCount: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxBudgets;
}

export function canCreateBill(currentCount: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxBills;
}

export function canCreateInvestment(currentCount: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxInvestments;
}

export function canCreateTransaction(currentMonthCount: number, tier: UserTier = "miskin"): boolean {
    const config = getTierConfig(tier);
    if (config.maxTransactionsPerMonth === null) return true;
    return currentMonthCount < config.maxTransactionsPerMonth;
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

export function canAccessSmartInput(tier: UserTier = "miskin"): boolean {
    return getTierConfig(tier).canAccessSmartInput;
}

export function canAccessAnalytics(tier: UserTier = "miskin"): boolean {
    return getTierConfig(tier).canAccessAnalytics;
}

export function canAccessInvestments(tier: UserTier = "miskin"): boolean {
    return getTierConfig(tier).canAccessInvestments;
}

export function getRemainingLimit(current: number, max: number | null): number | null {
    if (max === null) return null; // unlimited
    return Math.max(0, max - current);
}
