import { getDb } from "@/backend/db";
import { pushSubscriptions, notificationLogs } from "@/backend/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * Save or update a push subscription for a user.
 * Upserts by endpoint — if the endpoint already exists, updates the keys and reactivates it.
 */
export async function savePushSubscription(
    userId: number,
    subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
    },
    userAgent?: string,
    platform: "web" | "android" | "ios" = "web"
) {
    const db = getDb();

    // Check if subscription with this endpoint already exists
    const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .get();

    if (existing) {
        // Update existing subscription (reactivate if it was deactivated)
        await db
            .update(pushSubscriptions)
            .set({
                userId,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                isActive: true,
                userAgent: userAgent || existing.userAgent,
                platform,
                lastUsedAt: new Date(),
            })
            .where(eq(pushSubscriptions.id, existing.id))
            .run();

        return existing.id;
    }

    // Insert new subscription
    const [result] = await db
        .insert(pushSubscriptions)
        .values({
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            platform,
            userAgent: userAgent || null,
            isActive: true,
            lastUsedAt: new Date(),
        })
        .returning()
        .all();

    return result.id;
}

/**
 * Remove a push subscription by endpoint.
 */
export async function removePushSubscription(endpoint: string) {
    const db = getDb();
    await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint))
        .run();
}

/**
 * Get all active push subscriptions for a user.
 */
export async function getActiveSubscriptions(userId: number) {
    const db = getDb();
    return db
        .select()
        .from(pushSubscriptions)
        .where(
            and(
                eq(pushSubscriptions.userId, userId),
                eq(pushSubscriptions.isActive, true)
            )
        )
        .all();
}

/**
 * Get all active push subscriptions across all users.
 * Used by cron jobs to send bulk notifications.
 */
export async function getAllActiveSubscriptions() {
    const db = getDb();
    return db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.isActive, true))
        .all();
}

/**
 * Deactivate a push subscription (e.g., when the token becomes invalid).
 */
export async function deactivateSubscription(id: number) {
    const db = getDb();
    await db
        .update(pushSubscriptions)
        .set({ isActive: false })
        .where(eq(pushSubscriptions.id, id))
        .run();
}

/**
 * Deactivate a push subscription by endpoint.
 */
export async function deactivateSubscriptionByEndpoint(endpoint: string) {
    const db = getDb();
    await db
        .update(pushSubscriptions)
        .set({ isActive: false })
        .where(eq(pushSubscriptions.endpoint, endpoint))
        .run();
}

/**
 * Update lastUsedAt timestamp when a push is successfully sent.
 */
export async function touchSubscription(id: number) {
    const db = getDb();
    await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, id))
        .run();
}

/**
 * Log a notification send attempt.
 */
export async function logNotification(data: {
    userId: number;
    subscriptionId?: number;
    type: "daily_reminder" | "budget_alert" | "bill_reminder" | "weekly_summary" | "recurring_executed" | "custom";
    title: string;
    body: string;
    url?: string;
    status: "sent" | "failed" | "skipped";
    errorMessage?: string;
}) {
    const db = getDb();
    await db
        .insert(notificationLogs)
        .values({
            userId: data.userId,
            subscriptionId: data.subscriptionId || null,
            type: data.type,
            title: data.title,
            body: data.body,
            url: data.url || null,
            status: data.status,
            errorMessage: data.errorMessage || null,
        })
        .run();
}

/**
 * Get notification logs for a user, sorted by newest first.
 */
export async function getNotificationLogs(userId: number, limit: number = 20) {
    const db = getDb();
    return db
        .select()
        .from(notificationLogs)
        .where(eq(notificationLogs.userId, userId))
        .orderBy(desc(notificationLogs.createdAt))
        .limit(limit)
        .all();
}

/**
 * Mark specific notifications as read.
 */
export async function markNotificationsAsRead(userId: number, notificationIds: number[]) {
    const db = getDb();
    if (notificationIds.length === 0) return;
    
    await db
        .update(notificationLogs)
        .set({ isRead: true })
        .where(
            and(
                eq(notificationLogs.userId, userId),
                inArray(notificationLogs.id, notificationIds)
            )
        )
        .run();
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: number) {
    const db = getDb();
    await db
        .update(notificationLogs)
        .set({ isRead: true })
        .where(eq(notificationLogs.userId, userId))
        .run();
}
