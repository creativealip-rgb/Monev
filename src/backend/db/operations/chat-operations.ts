import { getDb } from "../index";
import { chatHistory } from "../schema";
import type { ChatHistory } from "../schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// Chat History
export async function getChatHistory(userId: number, limit = 25): Promise<ChatHistory[]> {
    const db = getDb();
    const history = await db.select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, userId))
        .orderBy(desc(chatHistory.createdAt))
        .limit(limit)
        .all();

    return history.reverse().map((message) => ({
        ...message,
        content: message.content.replace(/^\[(AI_USAGE|FREE_USAGE)\]\s*/, ""),
    })); // Return in chronological order without internal usage markers
}

export async function addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<ChatHistory> {
    const db = getDb();
    return db.insert(chatHistory).values({
        userId,
        role,
        content
    }).returning().get();
}

// ============ AI Chat History & Limits ============

export async function logAIChat(userId: number, role: "user" | "assistant", content: string, countsTowardLimit = false): Promise<ChatHistory> {
    const db = getDb();
    const markedContent = countsTowardLimit
        ? `[AI_USAGE] ${content}`
        : role === "user"
            ? `[FREE_USAGE] ${content}`
            : content;

    return db.insert(chatHistory).values({
        userId,
        role,
        content: markedContent,
    }).returning().get();
}

export async function getDailyAICount(userId: number): Promise<number> {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = db.select({ count: sql<number>`COUNT(*)` })
        .from(chatHistory)
        .where(and(
            eq(chatHistory.userId, userId),
            eq(chatHistory.role, "assistant"), // Count completed responses that reached the AI provider
            sql`${chatHistory.content} LIKE '[AI_USAGE]%'`,
            gte(chatHistory.createdAt, today)
        ))
        .get();

    return result?.count || 0;
}
