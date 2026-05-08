/**
 * Environment Variables Validation
 * 
 * Validates required environment variables at runtime
 * Prevents app from starting with missing/invalid configuration
 */

import { z } from "zod";

// Server-side environment schema
const serverEnvSchema = z.object({
    // Auth (Required)
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    AUTH_URL: z.string().url().optional(),

    // Database (Optional - has default)
    DATABASE_URL: z.string().optional().default("file:./sqlite.db"),

    // AI (Required for AI features)
    OPENAI_API_KEY: z.string().startsWith("sk-", "Invalid OpenAI API key format").optional(),
    AI_API_KEY: z.string().optional(),

    // Email (Optional)
    RESEND_API_KEY: z.string().startsWith("re_", "Invalid Resend API key format").optional(),
    FROM_EMAIL: z.string().email().optional(),

    // Telegram (Optional)
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_WEBHOOK_URL: z.string().url().optional(),

    // Push Notifications (Optional)
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),

    // Sentry (Optional)
    SENTRY_DSN: z.string().url().optional(),

    // Payment (Optional)
    MAYAR_API_KEY: z.string().optional(),
    MAYAR_API_TOKEN: z.string().optional(),

    // Notification (Optional)
    NOTIFICATION_API_KEY: z.string().optional(),

    // OAuth (Optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Node Environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Client-side environment schema (NEXT_PUBLIC_* variables)
const clientEnvSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().optional().default("Monev"),
    NEXT_PUBLIC_IS_APK: z.enum(["true", "false"]).optional().default("false"),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_GA_ID: z.string().optional(),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
});

// Type inference
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate server environment variables
 * Call this in server-side code only
 */
export function validateServerEnv(): ServerEnv {
    try {
        return serverEnvSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map(err => {
                const path = err.path.join(".");
                return `  - ${path}: ${err.message}`;
            }).join("\n");

            console.error("❌ Invalid environment variables:\n" + missingVars);
            
            // In development, show helpful message
            if (process.env.NODE_ENV === "development") {
                console.error("\n💡 Tip: Copy .env.example to .env.local and fill in the values");
            }

            throw new Error("Environment validation failed. Check the logs above.");
        }
        throw error;
    }
}

/**
 * Validate client environment variables
 * Safe to call in both server and client
 */
export function validateClientEnv(): ClientEnv {
    const clientEnv = Object.keys(process.env)
        .filter(key => key.startsWith("NEXT_PUBLIC_"))
        .reduce((acc, key) => {
            acc[key] = process.env[key];
            return acc;
        }, {} as Record<string, string | undefined>);

    try {
        return clientEnvSchema.parse(clientEnv);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map(err => {
                const path = err.path.join(".");
                return `  - ${path}: ${err.message}`;
            }).join("\n");

            console.error("❌ Invalid client environment variables:\n" + missingVars);
        }
        throw error;
    }
}

/**
 * Get validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = (() => {
    // Only validate on server-side
    if (typeof window === "undefined") {
        try {
            return validateServerEnv();
        } catch (error) {
            // In development, allow app to start with warnings
            if (process.env.NODE_ENV === "development") {
                console.warn("⚠️  Environment validation failed, using defaults");
                return serverEnvSchema.parse({
                    ...process.env,
                    AUTH_SECRET: process.env.AUTH_SECRET || "dev-secret-key-min-32-chars-long",
                });
            }
            throw error;
        }
    }
    
    // Return empty object for client-side (use clientEnv instead)
    return {} as ServerEnv;
})();

/**
 * Get validated client environment variables
 * Safe to use in both server and client
 */
export const clientEnv = validateClientEnv();

/**
 * Check if a feature is enabled based on environment
 */
export const features = {
    ai: !!(env.OPENAI_API_KEY || env.AI_API_KEY),
    email: !!env.RESEND_API_KEY,
    telegram: !!env.TELEGRAM_BOT_TOKEN,
    pushNotifications: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    sentry: !!env.SENTRY_DSN,
    payment: !!(env.MAYAR_API_KEY || env.MAYAR_API_TOKEN),
    oauth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
} as const;

// Log enabled features in development
if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
    console.log("\n🔧 Enabled Features:");
    Object.entries(features).forEach(([key, enabled]) => {
        console.log(`  ${enabled ? "✅" : "❌"} ${key}`);
    });
    console.log();
}
