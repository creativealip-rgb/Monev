import { getDb } from "../index";
import { streaks, achievements, userAchievements } from "../schema";
import type { Streak } from "../schema";
import { eq, and, desc } from "drizzle-orm";

type Achievement = typeof achievements.$inferSelect;

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
    return db.select()
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.unlockedAt))
        .all()
        .map((row: any) => row.achievements);
}

export async function unlockAchievement(userId: number, type: string, name: string, description: string) {
    const db = getDb();

    // Find achievement by code
    const achievement = db.select().from(achievements).where(eq(achievements.code, type)).get();
    if (!achievement) return;

    // Check if already unlocked
    const existing = db.select().from(userAchievements)
        .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievement.id)))
        .get();
    if (existing) return;

    return db.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date()
    }).run();
}
