import * as webpush from "web-push";
import { getActiveSubscriptions, deactivateSubscription, touchSubscription, logNotification } from "@/backend/db/operations/push-operations";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SendPush");

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@monev.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    actions?: Array<{ action: string; title: string }>;
}

export type NotificationType = "daily_reminder" | "budget_alert" | "bill_reminder" | "weekly_summary" | "recurring_executed" | "custom";

/**
 * Send a push notification to all active devices of a user.
 * Automatically handles invalid/expired subscriptions by deactivating them.
 */
export async function sendPushToUser(
    userId: number,
    payload: PushPayload,
    type: NotificationType = "custom"
): Promise<{ sent: number; failed: number }> {
    const subscriptions = await getActiveSubscriptions(userId);

    if (subscriptions.length === 0) {
        logger.info(`No active push subscriptions for user ${userId}`);
        return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
        try {
            await sendPushToSubscription(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload
            );

            // Update lastUsedAt
            await touchSubscription(sub.id);

            // Log success
            await logNotification({
                userId,
                subscriptionId: sub.id,
                type,
                title: payload.title,
                body: payload.body,
                url: payload.url,
                status: "sent",
            });

            sent++;
        } catch (error: unknown) {
            const statusCode = (error as { statusCode?: number })?.statusCode;

            // 404 or 410 means the subscription is no longer valid
            if (statusCode === 404 || statusCode === 410) {
                logger.info(`Deactivating expired subscription ${sub.id} for user ${userId}`);
                await deactivateSubscription(sub.id);
            }

            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Push failed for subscription ${sub.id}:`, errorMessage);

            // Log failure
            await logNotification({
                userId,
                subscriptionId: sub.id,
                type,
                title: payload.title,
                body: payload.body,
                url: payload.url,
                status: "failed",
                errorMessage,
            });

            failed++;
        }
    }

    return { sent, failed };
}

/**
 * Send a push notification to a single subscription.
 */
async function sendPushToSubscription(
    subscription: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
    },
    payload: PushPayload
) {
    const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/dashboard",
        tag: payload.tag || "monev-notification",
        actions: payload.actions || [],
    });

    await webpush.sendNotification(
        {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        },
        pushPayload,
        {
            TTL: 60 * 60, // 1 hour
            urgency: "normal",
        }
    );
}

/**
 * Send a push notification to multiple users at once.
 * Useful for batch notifications from cron jobs.
 */
export async function sendPushToUsers(
    userIds: number[],
    payload: PushPayload,
    type: NotificationType = "custom"
): Promise<{ totalSent: number; totalFailed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
        const result = await sendPushToUser(userId, payload, type);
        totalSent += result.sent;
        totalFailed += result.failed;
    }

    logger.info(`Batch push complete: ${totalSent} sent, ${totalFailed} failed for ${userIds.length} users`);

    return { totalSent, totalFailed };
}
