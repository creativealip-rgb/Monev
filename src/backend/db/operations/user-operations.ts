import { getDb } from "../index";
import { users, userSettings, transactions, budgets, goals, bills, investments, debts, scheduledMessages, merchantMappings, chatHistory } from "../schema";
import type { User, UserSettings } from "../schema";
import { eq } from "drizzle-orm";

// Users
export async function upsertUser(data: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    whatsappId?: string;
}): Promise<User> {
    const db = getDb();

    // Check if user exists by Telegram ID
    const existing = db.select().from(users).where(eq(users.telegramId, data.telegramId)).get();

    if (existing) {
        return db.update(users)
            .set({
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                whatsappId: data.whatsappId,
            })
            .where(eq(users.id, existing.id))
            .returning()
            .get();
    } else {
        return db.insert(users).values({
            telegramId: data.telegramId,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            whatsappId: data.whatsappId,
        }).returning().get();
    }
}

export async function getAllUsers(): Promise<User[]> {
    const db = getDb();
    return db.select().from(users).all();
}

export async function getUserByTelegramId(telegramId: number): Promise<User | undefined> {
    const db = getDb();
    return db.select().from(users).where(eq(users.telegramId, telegramId)).get();
}

export async function getUserById(id: number): Promise<User | undefined> {
    const db = getDb();
    return db.select().from(users).where(eq(users.id, id)).get();
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const db = getDb();
    return db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning()
        .get();
}

export async function linkTelegramAccount(userId: number, telegramId: number): Promise<{ success: boolean; message: string }> {
    const db = getDb();
    console.log("linkTelegramAccount called:", { userId, telegramId });

    // Check if telegramId is already used
    const existingUser = await db.select().from(users).where(eq(users.telegramId, telegramId)).get();

    if (existingUser) {
        if (existingUser.id === userId) {
            return { success: true, message: "Akun sudah terhubung." };
        }

        if (existingUser.email || existingUser.password) {
            return { success: false, message: "ID Telegram ini sudah digunakan oleh akun lain yang terdaftar." };
        }

        console.log("Merging ghost user:", existingUser.id, "into real user:", userId);

        // Migrate all related data from ghost user to real user
        // Tables to migrate: transactions, budgets, goals, bills, investments, debts, scheduledMessages, merchantMappings, userSettings

        await db.update(transactions).set({ userId: userId }).where(eq(transactions.userId, existingUser.id));
        await db.update(budgets).set({ userId: userId }).where(eq(budgets.userId, existingUser.id));
        await db.update(goals).set({ userId: userId }).where(eq(goals.userId, existingUser.id));
        await db.update(bills).set({ userId: userId }).where(eq(bills.userId, existingUser.id));
        await db.update(investments).set({ userId: userId }).where(eq(investments.userId, existingUser.id));
        await db.update(debts).set({ userId: userId }).where(eq(debts.userId, existingUser.id));
        await db.update(scheduledMessages).set({ userId: userId }).where(eq(scheduledMessages.userId, existingUser.id));
        await db.update(merchantMappings).set({ userId: userId }).where(eq(merchantMappings.userId, existingUser.id));
        await db.update(chatHistory).set({ userId: userId }).where(eq(chatHistory.userId, existingUser.id));

        // Delete ghost user settings (collision likely, just delete ghost's settings)
        await db.delete(userSettings).where(eq(userSettings.userId, existingUser.id));

        // Finally, delete the ghost user
        await db.delete(users).where(eq(users.id, existingUser.id));

        console.log("Migration complete.");
    }

    // Update current user
    console.log("Updating target user:", userId, "with Telegram ID:", telegramId);
    await db.update(users)
        .set({ telegramId: telegramId })
        .where(eq(users.id, userId));

    return { success: true, message: "Berhasil menghubungkan akun Telegram." };
}

export async function unlinkTelegramAccount(userId: number): Promise<void> {
    const db = getDb();
    await db.update(users)
        .set({ telegramId: null })
        .where(eq(users.id, userId));
}

// User Settings
export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const db = getDb();
    const settings = db.select().from(userSettings).where(eq(userSettings.userId, userId)).get();
    return settings; // Return settings or undefined if not found
}

export async function updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings> {
    const db = getDb();
    const existing = await getUserSettings(userId);
    if (!existing) {
        return db.insert(userSettings).values({
            userId,
            ...data,
            updatedAt: new Date(),
        }).returning().get();
    }

    return db.update(userSettings)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning()
        .get();
}
