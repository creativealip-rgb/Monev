"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendTelegramMessage } from "@/lib/telegram";
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

// --- Fetch Data ---

export async function fetchProfileData() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }
    const userId = parseInt(session.user.id);

    const user = await getUserById(userId);
    const settings = await getUserSettings(userId);
    const goals = await getGoals(userId);

    return {
        user,
        settings,
        goals
    };
}

// --- Update Actions ---

export async function updateProfile(formData: FormData) {
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

    try {
        // Link Telegram account (handle unique constraint)
        if (telegramId) {
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

    await updateUserSettings(userId, {
        hourlyRate: hourlyRate ? parseFloat(hourlyRate.toString()) : undefined,
        primaryGoalId: primaryGoalId ? parseInt(primaryGoalId.toString()) : null
    });

    revalidatePath("/profile");
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

    await updateUserSettings(userId, {
        securityPin: securityPin || null,
        isAppLockEnabled: isAppLockEnabled
    });

    revalidatePath("/profile");
    return { success: true };
}
