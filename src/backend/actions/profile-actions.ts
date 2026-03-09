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
    getAllUsers,
    getUserStreak,
    getUserAchievements,
    getMonthlyStats,
    getBudgets,
    getTransactions,
    getCategories,
    getInvestments,
    getBills
} from "@/backend/db/operations";
import { getFinancialPersona } from "@/lib/ai";
import { canUseTelegram, UserTier } from "@/lib/tier-gate";
import { getDb } from "@/backend/db";
import { userSettings } from "@/backend/db/schema";
import fs from "fs";
import path from "path";

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
            tier: user.tier || "starter"
        },
        settings: {
            id: settings.id,
            userId: settings.userId,
            hourlyRate: settings.hourlyRate,
            primaryGoalId: settings.primaryGoalId,
            isAppLockEnabled: settings.isAppLockEnabled,
            isBiometricEnabled: settings.isBiometricEnabled,
            hideBalance: settings.hideBalance, // Ensure hideBalance is included
            financialPersona: settings.financialPersona,
            updatedAt: settings.updatedAt,
            hasPin: !!settings.securityPin, // Only return boolean flag, not the actual PIN
            hasCompletedOnboarding: settings.hasCompletedOnboarding
        },
        goals,
        streak: await getUserStreak(userId),
        achievements: await getUserAchievements(userId)
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
        const imageFile = formData.get("image") as File | null;
        const telegramIdStr = formData.get("telegramId") as string;
        const telegramId = telegramIdStr ? parseInt(telegramIdStr) : null;

        let imagePath: string | undefined = undefined;

        // Handle File Upload
        if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const ext = path.extname(imageFile.name) || ".png";

            const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Cleanup old avatars for this user
            try {
                const files = fs.readdirSync(uploadDir);
                files.forEach(file => {
                    if (file.startsWith(`avatar-${userId}-`)) {
                        fs.unlinkSync(path.join(uploadDir, file));
                    }
                });
            } catch (e) {
                console.error("Error cleaning up old avatars:", e);
            }

            // Use a unique filename instead of a query string to bypass browser cache
            const timestamp = Date.now();
            const filename = `avatar-${userId}-${timestamp}${ext}`;
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, buffer);
            imagePath = `/uploads/avatars/${filename}`;
        }

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
        }

        await updateUser(userId, {
            firstName,
            lastName,
            username,
            whatsappId,
            ...(imagePath && { image: imagePath }),
            ...(telegramId === null && { telegramId: null })
        });

        revalidatePath("/profile");
        revalidatePath("/dashboard");
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

export async function toggleHideBalanceAction(value: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const userId = parseInt(session.user.id);

    await updateUserSettings(userId, {
        hideBalance: value
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    return { success: true };
}

export async function updateSecuritySettings(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const userId = parseInt(session.user.id);

    const securityPin = formData.get("securityPin") as string;
    const decoyPin = formData.get("decoyPin") as string;
    const isAppLockEnabled = formData.get("isAppLockEnabled") === "true";
    const isBiometricEnabled = formData.get("isBiometricEnabled") === "true";

    // Hash the PIN before saving (if provided)
    let hashedPin: string | null = null;
    if (securityPin && securityPin.length === 6) {
        hashedPin = await hashPin(securityPin);
    }

    let hashedDecoyPin: string | null = null;
    if (decoyPin && decoyPin.length === 6) {
        hashedDecoyPin = await hashPin(decoyPin);
    }

    await updateUserSettings(userId, {
        ...(hashedPin && { securityPin: hashedPin }),
        ...(hashedDecoyPin && { decoyPin: hashedDecoyPin }),
        isAppLockEnabled: isAppLockEnabled,
        isBiometricEnabled: isBiometricEnabled
    });

    revalidatePath("/profile");
    return { success: true };
}

export async function verifySecurityPin(pin: string): Promise<{ success: boolean; message?: string; isDecoy?: boolean }> {
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
    const isValidReal = await verifyPin(pin, settings.securityPin);

    // Check Decoy PIN
    if (settings.decoyPin) {
        const isValidDecoy = await verifyPin(pin, settings.decoyPin);
        if (isValidDecoy) {
            return { success: true, isDecoy: true };
        }
    }

    if (!isValidReal) {
        return {
            success: false,
            message: `PIN salah. Sisa percobaan: ${rateLimit.remaining}`
        };
    }

    return { success: true, isDecoy: false };
}

export async function generateFinancialPersonaAction() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = parseInt(session.user.id);

    // Build FinancialContext (similar to chat API)
    const now = new Date();
    const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
    const allGoals = await getGoals(userId);
    const allBudgets = await getBudgets(userId, now.getMonth() + 1, now.getFullYear());
    const rawTransactions = await getTransactions(userId, 50);
    const allCategories = await getCategories();
    const allInvestments = await getInvestments(userId);
    const allBills = await getBills(userId);

    const goalsContext = allGoals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        remaining: g.targetAmount - g.currentAmount,
        percent: (g.currentAmount / g.targetAmount) * 100
    }));

    const budgetsContext = allBudgets.map((b: any) => ({
        id: b.id,
        category: b.category.name,
        limit: b.amount,
        spent: b.spent,
        remaining: Math.max(0, b.amount - b.spent),
        percent: (b.spent / b.amount) * 100
    }));

    const transactionsContext = rawTransactions.map((t: any) => ({
        id: t.id,
        date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString(),
        amount: t.amount,
        description: t.description || "Tanpa Deskripsi",
        category: allCategories.find(c => c.id === t.categoryId)?.name || "Lainnya",
        type: t.type as "expense" | "income"
    }));

    const context = {
        monthlyStats: stats,
        goals: goalsContext,
        budgets: budgetsContext,
        transactions: transactionsContext,
        investments: allInvestments.map(i => ({
            id: i.id,
            name: i.name,
            type: i.type,
            quantity: i.quantity,
            currentPrice: i.currentPrice,
            totalValue: i.quantity * i.currentPrice,
            platform: i.platform
        })),
        bills: allBills.map(b => ({
            id: b.id,
            name: b.name,
            amount: b.amount,
            dueDate: b.dueDate,
            isPaid: b.isPaid,
            frequency: b.frequency
        }))
    };

    // Generate Persona
    const result = await getFinancialPersona(context);

    // Save to DB
    if (result && result.persona) {
        await updateUserSettings(userId, {
            financialPersona: JSON.stringify(result),
            personaUpdatedAt: new Date()
        });
    }

    revalidatePath("/profile");
    return { success: true, persona: result };
}
