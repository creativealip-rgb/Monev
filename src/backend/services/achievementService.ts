import { getDb, achievements, userAchievements } from "../db";
import { eq } from "drizzle-orm";

export async function unlockAchievement(userId: number, achievementCode: string) {
  const db = getDb();
  
  // Get achievement by code
  const achievement = await db
    .select()
    .from(achievements)
    .where(eq(achievements.code, achievementCode))
    .limit(1);

  if (!achievement || achievement.length === 0) {
    throw new Error(`Achievement not found: ${achievementCode}`);
  }

  // Check if already unlocked
  const existing = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .where(eq(userAchievements.achievementId, achievement[0].id))
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0]; // Already unlocked
  }

  // Unlock achievement
  const [unlocked] = await db
    .insert(userAchievements)
    .values({
      userId,
      achievementId: achievement[0].id,
      unlockedAt: new Date(),
      progress: 100,
    })
    .returning();

  return {
    ...unlocked,
    achievement: achievement[0],
  };
}

export async function getUserAchievements(userId: number) {
  const db = getDb();
  
  const unlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  return unlocked;
}
