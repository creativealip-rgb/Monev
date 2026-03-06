/**
 * @fileoverview Rate Limiting Utilities
 * 
 * Provides in-memory rate limiting for API routes and sensitive operations.
 * For production use, consider replacing with Redis-based rate limiting.
 * 
 * @packageDocumentation
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitOptions {
    maxRequests?: number;     // Max requests per window (default: 60)
    windowMs?: number;        // Time window in ms (default: 60000 = 1 min)
}

/**
 * Simple rate limiter for API routes.
 * 
 * Usage in an API route:
 * ```ts
 * import { rateLimit } from "@/lib/rate-limit";
 * 
 * export async function GET(req: NextRequest) {
 *     const limited = rateLimit(req, { maxRequests: 30 });
 *     if (limited) return limited;
 *     // ... rest of handler
 * }
 * ```
 */
export function rateLimit(
    req: NextRequest,
    options: RateLimitOptions = {}
): NextResponse | null {
    const { maxRequests = 60, windowMs = 60000 } = options;

    // Use IP + pathname as the rate limit key
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // Start new window
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return null;
    }

    entry.count++;

    if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return NextResponse.json(
            {
                error: "Too many requests",
                retryAfter,
                message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": retryAfter.toString(),
                    "X-RateLimit-Limit": maxRequests.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": entry.resetTime.toString(),
                },
            }
        );
    }

    return null;
}

/**
 * Rate limiter for PIN verification attempts.
 * Limits to 5 attempts per 15-minute window.
 */
export function checkPinRateLimit(key: string): { allowed: boolean; resetTime: number; remaining: number } {
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const now = Date.now();
    const entry = rateLimitStore.get(`pin:${key}`);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(`pin:${key}`, { count: 1, resetTime: now + windowMs });
        return { allowed: true, resetTime: now + windowMs, remaining: maxAttempts - 1 };
    }

    entry.count++;

    if (entry.count > maxAttempts) {
        return { allowed: false, resetTime: entry.resetTime, remaining: 0 };
    }

    return { allowed: true, resetTime: entry.resetTime, remaining: maxAttempts - entry.count };
}

