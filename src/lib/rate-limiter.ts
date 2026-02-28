/**
 * In-memory AI Rate Limiter
 * Key: "userId:YYYY-MM-DD" — auto-resets each new day
 */
import { UserTier, TIER_CONFIGS } from "@/lib/tier-gate";

const usageMap = new Map<string, number>();

function getDayKey(userId: number): string {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return `${userId}:${today}`;
}

export function getAIUsage(userId: number): number {
    return usageMap.get(getDayKey(userId)) || 0;
}

export function incrementAIUsage(userId: number): void {
    const key = getDayKey(userId);
    usageMap.set(key, (usageMap.get(key) || 0) + 1);
}

export interface RateLimitResult {
    allowed: boolean;
    used: number;
    limit: number | null; // null = unlimited
    remaining: number | null; // null = unlimited
}

export function checkAIRateLimit(userId: number, tier: UserTier): RateLimitResult {
    const config = TIER_CONFIGS[tier] || TIER_CONFIGS.miskin;
    const limit = config.aiDailyLimit;
    const used = getAIUsage(userId);

    if (limit === null) {
        // Unlimited tier
        return { allowed: true, used, limit: null, remaining: null };
    }

    return {
        allowed: used < limit,
        used,
        limit,
        remaining: Math.max(0, limit - used),
    };
}

/** Returns NextResponse-compatible headers for rate limit info */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Used": String(result.used),
        "X-RateLimit-Limit": result.limit === null ? "unlimited" : String(result.limit),
        "X-RateLimit-Remaining": result.remaining === null ? "unlimited" : String(result.remaining),
    };
}
