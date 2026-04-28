import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAIRateLimit, getRateLimitHeaders } from "@/lib/rate-limiter";
import { getUserTier } from "@/lib/tier-gate";

/**
 * Rate limit configuration by endpoint type
 */
export const RATE_LIMITS = {
    ai: {
        window: 60 * 1000, // 1 minute
        max: 60,
    },
    bulk: {
        window: 60 * 1000,
        max: 5,
    },
    export: {
        window: 60 * 1000,
        max: 10,
    },
    admin: {
        window: 60 * 1000,
        max: 100,
    },
} as const;

const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a specific endpoint
 */
function checkEndpointLimit(
    key: string,
    limit: { window: number; max: number }
): { allowed: boolean; resetTime: number; remaining: number } {
    const now = Date.now();
    const existing = requestCounts.get(key);

    if (!existing || now > existing.resetTime) {
        requestCounts.set(key, {
            count: 1,
            resetTime: now + limit.window,
        });
        return { allowed: true, resetTime: existing?.resetTime || now + limit.window, remaining: limit.max - 1 };
    }

    if (existing.count >= limit.max) {
        return { allowed: false, resetTime: existing.resetTime, remaining: 0 };
    }

    existing.count++;
    return { allowed: true, resetTime: existing.resetTime, remaining: limit.max - existing.count };
}

/**
 * Apply rate limiting to an API route
 * 
 * Usage:
 * export async function POST(request: Request) {
 *     const rateLimitResult = await applyRateLimit(request, "ai");
 *     if (rateLimitResult) return rateLimitResult;
 *     
 *     // ... your handler code
 * }
 */
export async function applyRateLimit(
    request: Request,
    endpointType: keyof typeof RATE_LIMITS
): Promise<NextResponse | null> {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const ip = request.headers.get("x-forwarded-for") || "anonymous";
        const identifier = userId || ip;
        const key = `${endpointType}:${identifier}`;

        const limit = RATE_LIMITS[endpointType];
        const result = checkEndpointLimit(key, limit);

        const headers = getRateLimitHeaders({
            allowed: result.allowed,
            used: limit.max - result.remaining,
            limit: limit.max,
            remaining: result.remaining,
        });

        headers["X-RateLimit-Reset"] = String(Math.ceil(result.resetTime / 1000));

        if (!result.allowed) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded",
                    message: "Too many requests. Please try again later.",
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
                },
                {
                    status: 429,
                    headers,
                }
            );
        }

        // Check AI-specific rate limit for AI endpoints
        if (endpointType === "ai" && userId) {
            const tier = getUserTier(session?.user);
            const aiResult = checkAIRateLimit(Number(userId), tier);

            if (!aiResult.allowed) {
                return NextResponse.json(
                    {
                        error: "AI limit exceeded",
                        message: `You have reached your daily AI limit (${aiResult.limit} requests). Upgrade for more.`,
                        used: aiResult.used,
                        limit: aiResult.limit,
                    },
                    {
                        status: 429,
                        headers: getRateLimitHeaders(aiResult),
                    }
                );
            }
        }

        return null;
    } catch (error) {
        console.error("Rate limit error:", error);
        return null;
    }
}

/**
 * Apply rate limit headers to a response
 */
export function withRateLimitHeaders(response: NextResponse, endpointType: keyof typeof RATE_LIMITS): NextResponse {
    try {
        const identifier = response.headers.get("x-user-id") || "anonymous";
        const key = `${endpointType}:${identifier}`;
        const limit = RATE_LIMITS[endpointType];
        const existing = requestCounts.get(key);

        if (existing) {
            const headers = getRateLimitHeaders({
                allowed: true,
                used: existing.count,
                limit: limit.max,
                remaining: limit.max - existing.count,
            });

            Object.entries(headers).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
        }

        return response;
    } catch (error) {
        console.error("Error adding rate limit headers:", error);
        return response;
    }
}
