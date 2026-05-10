import { getDb } from "../index";
import { achievements, streaks, transactions, userAchievements } from "../schema";
import type { Achievement, Streak } from "../schema";
import { and, desc, eq, sql } from "drizzle-orm";

const DEFAULT_ACHIEVEMENTS: Array<Omit<typeof achievements.$inferInsert, "id" | "createdAt">> = [
    {
        code: "first_tx",
        name: "First Transaction",
        description: "Transaksi pertama kamu tercatat.",
        icon: "Receipt",
        tier: "bronze",
        points: 10,
        category: "transaction",
    },
    {
        code: "tx_10",
        name: "10 Transactions",
        description: "Sudah mencatat 10 transaksi.",
        icon: "ListChecks",
        tier: "bronze",
        points: 25,
        category: "transaction",
    },
    {
        code: "tx_100",
        name: "100 Transactions",
        description: "100 transaksi tercatat. Konsisten banget!",
        icon: "Trophy",
        tier: "gold",
        points: 100,
        category: "transaction",
    },
    {
        code: "streak_3",
        name: "3 Day Streak",
        description: "3 hari berturut-turut catat transaksi.",
        icon: "Flame",
        tier: "bronze",
        points: 30,
        category: "streak",
    },
    {
        code: "streak_7",
        name: "7 Day Streak",
        description: "Seminggu konsisten catat transaksi.",
        icon: "Zap",
        tier: "silver",
        points: 70,
        category: "streak",
    },
    {
        code: "streak_30",
        name: "30 Day Streak",
        description: "Sebulan penuh menjaga kebiasaan baik.",
        icon: "Gem",
        tier: "platinum",
        points: 300,
        category: "streak",
    },
];

type AchievementProgress = {
    code: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
    points: number;
    category: string;
    current: number;
    target: number;
    percent: number;
    unlocked: boolean;
    unlockedAt: Date | null;
};

async function ensureDefaultAchievements() {
    const db = getDb();
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
        db.insert(achievements)
            .values(achievement)
            .onConflictDoUpdate({
                target: achievements.code,
                set: {
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    tier: achievement.tier,
                    points: achievement.points,
                    category: achievement.category,
                },
            })
            .run();
    }
}

function getRequirement(code: string) {
    if (code === "first_tx") return { currentKey: "transactions" as const, target: 1 };
    if (code === "tx_10") return { currentKey: "transactions" as const, target: 10 };
    if (code === "tx_100") return { currentKey: "transactions" as const, target: 100 };
    if (code === "streak_3") return { currentKey: "streak" as const, target: 3 };
    if (code === "streak_7") return { currentKey: "streak" as const, target: 7 };
    if (code === "streak_30") return { currentKey: "streak" as const, target: 30 };
    return { currentKey: "transactions" as const, target: 1 };
}

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
        const created = db.insert(streaks).values({
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastTransactionDate: today,
            updatedAt: now
        }).returning().get();
        await evaluateAndUnlockAchievements(userId);
        return created;
    }

    const lastDate = streak.lastTransactionDate ? new Date(streak.lastTransactionDate) : null;
    if (!lastDate) {
        const repaired = db.update(streaks)
            .set({ currentStreak: 1, longestStreak: Math.max(streak.longestStreak, 1), lastTransactionDate: today, updatedAt: now })
            .where(eq(streaks.userId, userId))
            .returning().get();
        await evaluateAndUnlockAchievements(userId);
        return repaired;
    }

    const lastTransactionDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffTime = today.getTime() - lastTransactionDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        await evaluateAndUnlockAchievements(userId);
        return streak;
    }

    if (diffDays === 1) {
        const newStreak = streak.currentStreak + 1;
        const newLongest = Math.max(newStreak, streak.longestStreak);
        const updated = db.update(streaks)
            .set({
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastTransactionDate: today,
                updatedAt: now
            })
            .where(eq(streaks.userId, userId))
            .returning().get();
        await evaluateAndUnlockAchievements(userId);
        return updated;
    }

    const reset = db.update(streaks)
        .set({
            currentStreak: 1,
            longestStreak: Math.max(streak.longestStreak, 1),
            lastTransactionDate: today,
            updatedAt: now
        })
        .where(eq(streaks.userId, userId))
        .returning().get();
    await evaluateAndUnlockAchievements(userId);
    return reset;
}

export async function getAllAchievements(): Promise<Achievement[]> {
    await ensureDefaultAchievements();
    const db = getDb();
    return db.select().from(achievements).orderBy(achievements.points).all();
}

export async function getUserAchievements(userId: number) {
    await ensureDefaultAchievements();
    const db = getDb();
    return db
        .select({
            id: achievements.id,
            code: achievements.code,
            name: achievements.name,
            description: achievements.description,
            icon: achievements.icon,
            tier: achievements.tier,
            points: achievements.points,
            category: achievements.category,
            unlockedAt: userAchievements.unlockedAt,
            progress: userAchievements.progress,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.unlockedAt))
        .all();
}

export async function getAchievementProgress(userId: number): Promise<AchievementProgress[]> {
    const db = getDb();
    const [allAchievements, unlocked, streak] = await Promise.all([
        getAllAchievements(),
        getUserAchievements(userId),
        getUserStreak(userId),
    ]);
    const transactionCount = db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .get()?.count || 0;
    const unlockedMap = new Map(unlocked.map(item => [item.code, item]));

    return allAchievements.map((achievement) => {
        const requirement = getRequirement(achievement.code);
        const current = requirement.currentKey === "streak" ? streak?.currentStreak || 0 : transactionCount;
        const unlockedItem = unlockedMap.get(achievement.code);
        return {
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.tier,
            points: achievement.points,
            category: achievement.category,
            current,
            target: requirement.target,
            percent: Math.min(100, Math.round((current / requirement.target) * 100)),
            unlocked: Boolean(unlockedItem),
            unlockedAt: unlockedItem?.unlockedAt || null,
        };
    });
}

export async function unlockAchievement(userId: number, achievementCode: string) {
    await ensureDefaultAchievements();
    const db = getDb();
    const achievement = db.select().from(achievements).where(eq(achievements.code, achievementCode)).get();
    if (!achievement) return;

    const existing = db.select().from(userAchievements).where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievement.id))).get();
    if (existing) return existing;

    return db.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
        progress: 100,
    }).returning().get();
}

export async function evaluateAndUnlockAchievements(userId: number) {
    const progress = await getAchievementProgress(userId);
    const unlocked = [];
    for (const item of progress) {
        if (!item.unlocked && item.current >= item.target) {
            const result = await unlockAchievement(userId, item.code);
            if (result) unlocked.push(item.code);
        }
    }
    return unlocked;
}
