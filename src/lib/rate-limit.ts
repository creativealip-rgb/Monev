// Simple in-memory rate limiting for Next.js
// For production, consider using Redis (Upstash, etc.)

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    max: number; // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
};

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining attempts
 */
export function checkRateLimit(
    identifier: string,
    config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
    const { windowMs, max } = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const key = identifier;

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // New window or expired
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(key, newEntry);
        return {
            allowed: true,
            remaining: max - 1,
            resetTime: newEntry.resetTime,
        };
    }

    if (entry.count >= max) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: max - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Rate limit specifically for authentication endpoints
 * Stricter limits for login attempts
 */
export function checkAuthRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
} {
    return checkRateLimit(identifier, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per 15 minutes
    });
}

/**
 * Rate limit for PIN verification attempts
 * Very strict to prevent brute force
 */
export function checkPinRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
} {
    return checkRateLimit(`pin:${identifier}`, {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 attempts per hour
    });
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// Auto-cleanup every hour
if (typeof window === "undefined") {
    setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}
