export type UserTier = "starter" | "pro" | "sultan" | "benefactor";

export interface TierConfig {
    name: string;
    maxGoals: number;
    maxCategories: number;
    maxTransactionsPerMonth: number | null; // null = unlimited
    maxBudgets: number;
    maxBills: number;
    maxInvestments: number;
    maxBankAccounts: number;
    aiDailyLimit: number | null; // null = unlimited
    ocrMonthlyLimit: number | null;
    analyticsLevel: "basic" | "full" | "advanced";
    exportFormats: string[];
    adFree: boolean;
    canAccessAnalytics: boolean;
    canAccessInvestments: boolean;
    canAccessSmartInput: boolean;
    canAccessSmartAgents: boolean;
    canExport: boolean;
    canUseTelegramBot: boolean;
    telegramBotType: "none" | "command" | "ai";
    features: string[];
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
    starter: {
        name: "Starter",
        maxGoals: 1,
        maxCategories: 3,
        maxTransactionsPerMonth: 100,
        maxBudgets: 3,
        maxBills: 3,
        maxInvestments: 0,
        maxBankAccounts: 2,
        aiDailyLimit: 10,
        ocrMonthlyLimit: 0,
        analyticsLevel: "basic",
        exportFormats: ["CSV"],
        adFree: false,
        canAccessAnalytics: true,
        canAccessInvestments: false,
        canAccessSmartInput: false,
        canAccessSmartAgents: false,
        canExport: true,
        canUseTelegramBot: false,
        telegramBotType: "none",
        features: [
            "100 Transaksi/bulan",
            "2 Akun Bank",
            "3 Anggaran",
            "1 Target Tabungan",
            "3 Tagihan",
            "10 Monev AI Chats/hari",
            "Export CSV",
        ],
    },
    pro: {
        name: "Pro",
        maxGoals: 10,
        maxCategories: 20,
        maxTransactionsPerMonth: null,
        maxBudgets: 20,
        maxBills: 20,
        maxInvestments: 100,
        maxBankAccounts: 10,
        aiDailyLimit: 100,
        ocrMonthlyLimit: 100,
        analyticsLevel: "full",
        exportFormats: ["CSV", "Excel"],
        adFree: true,
        canAccessAnalytics: true,
        canAccessInvestments: true,
        canAccessSmartInput: true,
        canAccessSmartAgents: true,
        canExport: true,
        canUseTelegramBot: true,
        telegramBotType: "command",
        features: [
            "Transaksi Unlimited",
            "10 Akun Bank",
            "20 Anggaran",
            "10 Target Tabungan",
            "20 Tagihan",
            "Investasi (Basic)",
            "100 Monev AI Chats/hari",
            "Smart Input AI (Voice & Foto)",
            "100 OCR Scans/bulan",
            "Export CSV + Excel",
            "Telegram Bot (Command)",
            "Full Analytics",
        ],
    },
    sultan: {
        name: "Sultan",
        maxGoals: 1000,
        maxCategories: 1000,
        maxTransactionsPerMonth: null,
        maxBudgets: 1000,
        maxBills: 1000,
        maxInvestments: 1000,
        maxBankAccounts: 1000,
        aiDailyLimit: null,
        ocrMonthlyLimit: null,
        analyticsLevel: "advanced",
        exportFormats: ["CSV", "Excel", "PDF"],
        adFree: true,
        canAccessAnalytics: true,
        canAccessInvestments: true,
        canAccessSmartInput: true,
        canAccessSmartAgents: true,
        canExport: true,
        canUseTelegramBot: true,
        telegramBotType: "ai",
        features: [
            "Transaksi Unlimited",
            "Akun Bank Unlimited",
            "Anggaran Unlimited",
            "Target Tabungan Unlimited",
            "Tagihan Unlimited",
            "Investasi Advanced",
            "Monev AI Chat Unlimited",
            "Smart Input AI Unlimited",
            "OCR Scans Unlimited",
            "Export CSV + Excel + PDF",
            "Telegram Bot (AI Conversational)",
            "Advanced Analytics",
            "Tax Reports",
            "Auto Cloud Backup",
            "Priority WhatsApp Support",
        ],
    },
    benefactor: {
        name: "Benefactor",
        maxGoals: 1000,
        maxCategories: 1000,
        maxTransactionsPerMonth: null,
        maxBudgets: 1000,
        maxBills: 1000,
        maxInvestments: 1000,
        maxBankAccounts: 1000,
        aiDailyLimit: null,
        ocrMonthlyLimit: null,
        analyticsLevel: "advanced",
        exportFormats: ["CSV", "Excel", "PDF"],
        adFree: true,
        canAccessAnalytics: true,
        canAccessInvestments: true,
        canAccessSmartInput: true,
        canAccessSmartAgents: true,
        canExport: true,
        canUseTelegramBot: true,
        telegramBotType: "ai",
        features: [
            "Semua fitur Sultan",
            "Early Access fitur baru",
            "Request fitur langsung ke developer",
            "Kontak WhatsApp developer",
            "Badge Benefactor eksklusif",
            "Prioritas voting roadmap",
            "Support pengembangan Monev",
        ],
    },
};

// Tier hierarchy for comparison
const TIER_LEVELS: Record<UserTier, number> = {
    starter: 0,
    pro: 1,
    sultan: 2,
    benefactor: 3,
};

export function getTierConfig(tier: UserTier = "starter"): TierConfig {
    return TIER_CONFIGS[tier] || TIER_CONFIGS.starter;
}

export function getUserTier(user: any): UserTier {
    if (!user) return "starter";
    return (user.tier as UserTier) || "starter";
}

export function isTierSufficient(userTier: UserTier, requiredTier: UserTier): boolean {
    return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
}

export function canCreateGoal(currentCount: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxGoals;
}

export function canCreateBudget(currentCount: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxBudgets;
}

export function canCreateBill(currentCount: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxBills;
}

export function canCreateInvestment(currentCount: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    return currentCount < config.maxInvestments;
}

export function canCreateTransaction(currentMonthCount: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    if (config.maxTransactionsPerMonth === null) return true;
    return currentMonthCount < config.maxTransactionsPerMonth;
}

export function canUseAI(currentUsageToday: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    if (config.aiDailyLimit === null) return true;
    return currentUsageToday < config.aiDailyLimit;
}

export function canUseOCR(currentUsageMonth: number, tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    if (config.ocrMonthlyLimit === null) return true;
    return currentUsageMonth < config.ocrMonthlyLimit;
}

export function hasFullAnalytics(tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    return config.analyticsLevel === "full" || config.analyticsLevel === "advanced";
}

export function canUseTelegram(tier: UserTier = "starter"): boolean {
    const config = getTierConfig(tier);
    return config.canUseTelegramBot;
}

export function getTelegramBotType(tier: UserTier = "starter"): "none" | "command" | "ai" {
    const config = getTierConfig(tier);
    return config.telegramBotType;
}

export function canAccessSmartInput(tier: UserTier = "starter"): boolean {
    return getTierConfig(tier).canAccessSmartInput;
}

export function canAccessAnalytics(tier: UserTier = "starter"): boolean {
    return getTierConfig(tier).canAccessAnalytics;
}

export function canAccessInvestments(tier: UserTier = "starter"): boolean {
    return getTierConfig(tier).canAccessInvestments;
}

export function getRemainingLimit(current: number, max: number | null): number | null {
    if (max === null) return null; // unlimited
    return Math.max(0, max - current);
}

// Helper functions for tier upgrade/downgrade
export function getTierUpgradePath(currentTier: UserTier): UserTier[] {
    const path: UserTier[] = [];
    if (currentTier === "starter") path.push("pro", "sultan", "benefactor");
    if (currentTier === "pro") path.push("sultan", "benefactor");
    if (currentTier === "sultan") path.push("benefactor");
    return path;
}

export function getTierPrice(tier: UserTier): { monthly: number; annual: number } {
    switch (tier) {
        case "starter":
            return { monthly: 0, annual: 0 };
        case "pro":
            return { monthly: 29000, annual: 290000 }; // 17% discount
        case "sultan":
            return { monthly: 49000, annual: 490000 }; // 17% discount
        case "benefactor":
            return { monthly: 0, annual: 199000 }; // yearly supporter tier
        default:
            return { monthly: 0, annual: 0 };
    }
}
