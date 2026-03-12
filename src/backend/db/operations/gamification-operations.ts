import { getDb } from "../index";
import { streaks, achievements } from "../schema";
import type { Streak, Achievement } from "../schema";
import { eq, and, desc } from "drizzle-orm";

// ============ Gamification (Streaks & Achievements) ============

export async function getUserStreak(userId: number): Promise<Streak | undefined> {
    const db = getDb();
    return db.select().from(streaks).where(eq(streaks.userId, userId)).get();
}

export async function updateUserStreak(userId: number): Promise<Streak> {
    const db = getDb();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const streak = await getUserStreak(userId);

    if (!streak) {
        // First time streak
        return db.insert(streaks).values({
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastTransactionDate: today,
            updatedAt: now
        }).returning().get();
    }

    const lastDate = streak.lastTransactionDate ? new Date(streak.lastTransactionDate) : null;
    if (!lastDate) {
        // Repair streak if lastDate is null
        return db.update(streaks)
            .set({ currentStreak: 1, lastTransactionDate: today, updatedAt: now })
            .where(eq(streaks.userId, userId))
            .returning().get();
    }

    const lastTransactionDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffTime = today.getTime() - lastTransactionDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Already recorded today, no streak change
        return streak;
    } else if (diffDays === 1) {
        // Consecutive day!
        const newStreak = streak.currentStreak + 1;
        const newLongest = Math.max(newStreak, streak.longestStreak);

        const updated = await db.update(streaks)
            .set({
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastTransactionDate: today,
                updatedAt: now
            })
            .where(eq(streaks.userId, userId))
            .returning().get();

        // Check for streak milestones
        if (newStreak === 3) await unlockAchievement(userId, "streak_3", "Semangat 3 Hari", "Catat transaksi 3 hari berturut-turut! 🔥");
        if (newStreak === 7) await unlockAchievement(userId, "streak_7", "Petarung Mingguan", "7 hari tanpa putus! Hebat Bos! 🛡️");
        if (newStreak === 30) await unlockAchievement(userId, "streak_30", "Legenda Finansial", "Sebulan penuh konsistensi! Sultan bangga. 👑");

        return updated;
    } else {
        // Streak broken
        return db.update(streaks)
            .set({
                currentStreak: 1,
                lastTransactionDate: today,
                updatedAt: now
            })
            .where(eq(streaks.userId, userId))
            .returning().get();
    }
}

export async function getUserAchievements(userId: number): Promise<Achievement[]> {
    const db = getDb();
    return db.select().from(achievements).where(eq(achievements.userId, userId)).orderBy(desc(achievements.unlockedAt)).all();
}

export async function unlockAchievement(userId: number, type: string, name: string, description: string) {
    const db = getDb();

    // Check if already unlocked
    const existing = db.select().from(achievements).where(and(eq(achievements.userId, userId), eq(achievements.type, type))).get();
    if (existing) return;

    return db.insert(achievements).values({
        userId,
        type,
        name,
        description,
        unlockedAt: new Date()
    }).run();
}
