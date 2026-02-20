"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendTelegramMessage } from "@/lib/telegram";
import { hashPin, verifyPin } from "@/lib/security";
import { checkPinRateLimit } from "@/lib/rate-limit";
import {
    getUserSettings,
    updateUserSettings,
    getUserById,
    upsertUser,
    updateUser,
    linkTelegramAccount,
    unlinkTelegramAccount,
    getGoals,
    getAllUsers
} from "@/backend/db/operations";
import { canUseTelegram, UserTier } from "@/lib/tier-gate";
import { getDb } from "@/backend/db"; // New: Import getDb
import { userSettings } from "@/backend/db/schema"; // New: Import userSettings schema

// --- Fetch Data ---

export async function fetchProfileData() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }
    const userId = parseInt(session.user.id);

    const user = await getUserById(userId); // Ensure user exists
    if (!user) {
        console.error(`User with ID ${userId} not found but session exists. This should not happen.`);
        // Potentially, log out the user or redirect to a page to create an account.
        return null;
    }

    let settings = await getUserSettings(userId);
    if (!settings) {
        // Create default settings if they don't exist for a valid user
        const db = getDb();
        settings = await db.insert(userSettings).values({
            userId,
            hourlyRate: 50000,
            hideBalance: false, // Ensure default for hideBalance
            hasCompletedOnboarding: false,
        }).returning().get();
    }
    const goals = await getGoals(userId);

    // Return safe settings (without securityPin) and a flag indicating if PIN exists
    return {
        user: {
            ...user,
            tier: user.tier || "miskin"
        },
        settings: {
            id: settings.id,
            userId: settings.userId,
            hourlyRate: settings.hourlyRate,
            primaryGoalId: settings.primaryGoalId,
            isAppLockEnabled: settings.isAppLockEnabled,
            hideBalance: settings.hideBalance, // Ensure hideBalance is included
            updatedAt: settings.updatedAt,
            hasPin: !!settings.securityPin, // Only return boolean flag, not the actual PIN
            hasCompletedOnboarding: settings.hasCompletedOnboarding
        },
        goals
    };
}

// --- Update Actions ---

export async function updateProfile(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error("Unauthorized");
        }
        const userId = parseInt(session.user.id);

        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const username = formData.get("username") as string;
        const whatsappId = formData.get("whatsappId") as string;
        const telegramIdStr = formData.get("telegramId") as string;
        const telegramId = telegramIdStr ? parseInt(telegramIdStr) : null;

        console.log("updateProfile Action Triggered:", { userId, telegramId, telegramIdStr });

        // Fetch user data for tier check
        const user = await getUserById(userId);
        if (!user) {
            return { success: false, message: "Pengguna tidak ditemukan" };
        }

        // Link Telegram account (handle unique constraint)
        if (telegramId) {
            // Tier check
            if (!canUseTelegram(user.tier as UserTier)) {
                return { success: false, message: "Fitur Telegram hanya tersedia untuk Sultan! 👑" };
            }

            console.log("Attempting to link Telegram Account...");
            const linkResult = await linkTelegramAccount(userId, telegramId);
            console.log("Link Result:", linkResult);
            if (!linkResult.success) {
                console.error("Link Telegram Error:", linkResult.message);
                return { success: false, message: linkResult.message };
            }
            // Send welcome message
            await sendTelegramMessage(telegramId, `🎉 **Selamat Datang, ${firstName || "Sultan"}!**\n\nAkun Telegram kamu berhasil terhubung dengan Monev.\nSekarang kamu bisa mencatat transaksi langsung dari sini. Coba ketik:\n\n*"Makan siang 25rb"*`);
        } else {
            // If telegramIdStr is empty, it means the user might be unlinking or not providing a new one.
            // The `updateUser` call below will handle setting `telegramId: null` if it was previously linked
            // and the user submitted an empty telegramId field.
        }

        await updateUser(userId, {
            firstName,
            lastName,
            username,
            whatsappId,
            // If telegramId was linked successfully above, it's already set.
            // If explicit unlink (future feature), we'd handle it here.
            ...(telegramId === null && { telegramId: null })
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Update Profile Error:", error);
        return { success: false, message: `Gagal menyimpan: ${error.message || "Kesalahan sistem"}` };
    }
}

export async function disconnectTelegram() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }
    const userId = parseInt(session.user.id);

    try {
        await unlinkTelegramAccount(userId);
        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Disconnect Telegram Error:", error);
        return { success: false, message: "Gagal memutuskan koneksi Telegram." };
    }
}

export async function updateFinancialSettings(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const userId = parseInt(session.user.id);

    const hourlyRate = formData.get("hourlyRate");
    const primaryGoalId = formData.get("primaryGoalId");
    const hideBalance = formData.get("hideBalance"); // New: Get hideBalance from form

    await updateUserSettings(userId, {
        hourlyRate: hourlyRate ? parseFloat(hourlyRate.toString()) : undefined,
        primaryGoalId: primaryGoalId ? parseInt(primaryGoalId.toString()) : null,
        hideBalance: hideBalance === "true" // New: Convert to boolean
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard"); // Revalidate dashboard as well
    return { success: true };
}

export async function updateSecuritySettings(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const userId = parseInt(session.user.id);

    const securityPin = formData.get("securityPin") as string;
    const isAppLockEnabled = formData.get("isAppLockEnabled") === "true";

    // Hash the PIN before saving (if provided)
    let hashedPin: string | null = null;
    if (securityPin && securityPin.length === 6) {
        hashedPin = await hashPin(securityPin);
    }

    await updateUserSettings(userId, {
        securityPin: hashedPin,
        isAppLockEnabled: isAppLockEnabled
    });

    revalidatePath("/profile");
    return { success: true };
}

export async function verifySecurityPin(pin: string): Promise<{ success: boolean; message?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }
    const userId = parseInt(session.user.id);

    // Check rate limiting
    const rateLimit = checkPinRateLimit(`user:${userId}`);
    if (!rateLimit.allowed) {
        const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000));
        return {
            success: false,
            message: `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutesLeft} menit.`
        };
    }

    // Get user's hashed PIN from database
    const settings = await getUserSettings(userId);
    if (!settings || !settings.securityPin) {
        return { success: false, message: "PIN belum diatur" };
    }

    // Verify PIN
    const isValid = await verifyPin(pin, settings.securityPin);

    if (!isValid) {
        return {
            success: false,
            message: `PIN salah. Sisa percobaan: ${rateLimit.remaining}`
        };
    }

    return { success: true };
}
