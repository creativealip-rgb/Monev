export type MayarTier = "pro" | "sultan";

export const MAYAR_TIER_CONFIG: Record<MayarTier, { name: string; amount: number; description: string }> = {
    pro: {
        name: "Monev Pro Monthly",
        amount: 29000,
        description: "Paket Pro Monev - langganan bulanan",
    },
    sultan: {
        name: "Monev Sultan Monthly",
        amount: 49000,
        description: "Paket Sultan Monev - langganan bulanan",
    },
};

export function isMayarTier(value: unknown): value is MayarTier {
    return value === "pro" || value === "sultan";
}

export function getMayarApiKey() {
    return process.env.MAYAR_API_KEY || process.env.MAYAR_API_TOKEN || "";
}

export function getAppUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://monev.app").replace(/\/$/, "");
}

export function addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}
