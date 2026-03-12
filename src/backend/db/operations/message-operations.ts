import { getDb } from "../index";
import { scheduledMessages } from "../schema";
import type { ScheduledMessage } from "../schema";
import { eq, and, lte } from "drizzle-orm";

// Scheduled Messages (Stock Opname etc)
export async function createScheduledMessage(data: {
    userId: number;
    message: string;
    scheduledAt: Date;
    type?: "stock_opname" | "reminder" | "other"
}): Promise<ScheduledMessage> {
    const db = getDb();
    return db.insert(scheduledMessages).values({
        ...data,
        status: "pending",
        type: data.type || "other"
    }).returning().get();
}

export async function getPendingScheduledMessages(): Promise<ScheduledMessage[]> {
    // This might be a system level usage, but mostly should be fine to check all
    // Or we filter by user if specific user asks?
    // Usually a cron job runs this.
    const db = getDb();
    const now = new Date();
    return db.select()
        .from(scheduledMessages)
        .where(and(
            eq(scheduledMessages.status, "pending"),
            lte(scheduledMessages.scheduledAt, now)
        ))
        .all();
}

export async function markScheduledMessageSent(id: number): Promise<void> {
    const db = getDb();
    await db.update(scheduledMessages)
        .set({ status: "sent" })
        .where(eq(scheduledMessages.id, id));
}
