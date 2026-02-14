"use server";

import { revalidatePath } from "next/cache";
import {
    getUserSettings,
    updateUserSettings,
    getUserById,
    upsertUser,
    getGoals,
    getAllUsers
} from "@/backend/db/operations";

// --- Fetch Data ---

export async function fetchProfileData() {
    // For now, we assume single user mode or take the first user found
    // In a real app, this would come from session/auth
    const allUsers = await getAllUsers();
    const user = allUsers.length > 0 ? allUsers[0] : null;

    const settings = await getUserSettings();
    const goals = await getGoals();

    return {
        user,
        settings,
        goals
    };
}

// --- Update Actions ---

export async function updateProfile(formData: FormData) {
    const rawId = formData.get("id");
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const username = formData.get("username") as string;
    const whatsappId = formData.get("whatsappId") as string;
    const telegramId = formData.get("telegramId");

    if (!rawId || !telegramId) {
        throw new Error("Missing ID or Telegram ID");
    }

    await upsertUser({
        telegramId: parseInt(telegramId.toString()),
        firstName,
        lastName,
        username,
        whatsappId
    });

    revalidatePath("/profile");
    return { success: true };
}

export async function updateFinancialSettings(formData: FormData) {
    const hourlyRate = formData.get("hourlyRate");
    const primaryGoalId = formData.get("primaryGoalId");

    await updateUserSettings({
        hourlyRate: hourlyRate ? parseFloat(hourlyRate.toString()) : undefined,
        primaryGoalId: primaryGoalId ? parseInt(primaryGoalId.toString()) : null
    });

    revalidatePath("/profile");
    revalidatePath("/profile");
    return { success: true };
}

export async function updateSecuritySettings(formData: FormData) {
    const securityPin = formData.get("securityPin") as string;
    const isAppLockEnabled = formData.get("isAppLockEnabled") === "true";

    await updateUserSettings({
        securityPin: securityPin || null,
        isAppLockEnabled: isAppLockEnabled
    });

    revalidatePath("/profile");
    return { success: true };
}
