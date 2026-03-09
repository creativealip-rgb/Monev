"use server";

import { getDb } from "@/backend/db";
import { usageTracking } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Increment usage counter for a specific feature
 */
export async function incrementUsage(
    userId: number,
    feature: "transactions" | "ai_chats" | "ocr_scans" | "telegram_messages"
) {
    const db = getDb();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
        // Get or create usage record
        const record = await db
            .select()
            .from(usageTracking)
            .where(
                and(
                    eq(usageTracking.userId, userId),
                    eq(usageTracking.month, month),
                    eq(usageTracking.year, year)
                )
            )
            .get();

        if (!record) {
            // Create new record
            await db.insert(usageTracking).values({
                userId,
                month,
                year,
                transactionsCount: feature === "transactions" ? 1 : 0,
                aiChatsCount: feature === "ai_chats" ? 1 : 0,
                ocrScansCount: feature === "ocr_scans" ? 1 : 0,
                telegramMessagesCount: feature === "telegram_messages" ? 1 : 0,
            });
        } else {
            // Increment existing
            const updateData: any = {};
            if (feature === "transactions") {
                updateData.transactionsCount = (record.transactionsCount || 0) + 1;
            } else if (feature === "ai_chats") {
                updateData.aiChatsCount = (record.aiChatsCount || 0) + 1;
            } else if (feature === "ocr_scans") {
                updateData.ocrScansCount = (record.ocrScansCount || 0) + 1;
            } else if (feature === "telegram_messages") {
                updateData.telegramMessagesCount = (record.telegramMessagesCount || 0) + 1;
            }

            await db
                .update(usageTracking)
                .set(updateData)
                .where(eq(usageTracking.id, record.id));
        }
    } catch (error) {
        console.error("Error incrementing usage:", error);
        // Don't throw - usage tracking should not block main operation
    }
}

/**
 * Get current usage for a user
 */
export async function getUsage(userId: number) {
    const db = getDb();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
        const record = await db
            .select()
            .from(usageTracking)
            .where(
                and(
                    eq(usageTracking.userId, userId),
                    eq(usageTracking.month, month),
                    eq(usageTracking.year, year)
                )
            )
            .get();

        return (
            record || {
                transactionsCount: 0,
                aiChatsCount: 0,
                ocrScansCount: 0,
                telegramMessagesCount: 0,
            }
        );
    } catch (error) {
        console.error("Error getting usage:", error);
        return {
            transactionsCount: 0,
            aiChatsCount: 0,
            ocrScansCount: 0,
            telegramMessagesCount: 0,
        };
    }
}

/**
 * Check if user has reached their tier limit for a feature
 */
export async function checkLimit(
    userId: number,
    userTier: "starter" | "pro" | "sultan",
    feature: "transactions" | "ai_chats" | "ocr_scans" | "telegram_messages"
): Promise<boolean> {
    const { TIER_CONFIGS } = await import("@/lib/tier-gate");
    const config = TIER_CONFIGS[userTier];
    const usage = await getUsage(userId);

    switch (feature) {
        case "transactions":
            if (config.maxTransactionsPerMonth === null) return true;
            return (usage.transactionsCount || 0) < config.maxTransactionsPerMonth;

        case "ai_chats":
            if (config.aiDailyLimit === null) return true;
            // For daily limit, we'd need separate daily tracking
            // For now, use monthly as approximation
            return (usage.aiChatsCount || 0) < (config.aiDailyLimit * 30);

        case "ocr_scans":
            if (config.ocrMonthlyLimit === null) return true;
            return (usage.ocrScansCount || 0) < config.ocrMonthlyLimit;

        case "telegram_messages":
            return config.canUseTelegramBot;

        default:
            return true;
    }
}

/**
 * Get remaining limit for a feature
 */
export async function getRemainingLimit(
    userId: number,
    userTier: "starter" | "pro" | "sultan",
    feature: "transactions" | "ai_chats" | "ocr_scans"
): Promise<number | null> {
    const { TIER_CONFIGS, getRemainingLimit: calcRemaining } = await import("@/lib/tier-gate");
    const config = TIER_CONFIGS[userTier];
    const usage = await getUsage(userId);

    switch (feature) {
        case "transactions":
            if (config.maxTransactionsPerMonth === null) return null;
            return calcRemaining(usage.transactionsCount || 0, config.maxTransactionsPerMonth);

        case "ai_chats":
            if (config.aiDailyLimit === null) return null;
            return calcRemaining(usage.aiChatsCount || 0, config.aiDailyLimit * 30);

        case "ocr_scans":
            if (config.ocrMonthlyLimit === null) return null;
            return calcRemaining(usage.ocrScansCount || 0, config.ocrMonthlyLimit);

        default:
            return null;
    }
}

/**
 * Reset usage for testing purposes
 */
export async function resetUsage(userId: number) {
    const db = getDb();

    try {
        await db.delete(usageTracking).where(eq(usageTracking.userId, userId));
        return true;
    } catch (error) {
        console.error("Error resetting usage:", error);
        return false;
    }
}
