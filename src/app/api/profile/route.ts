import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    getUserById,
    getUserSettings,
    getGoals,
    getUserStreak,
    getUserAchievements,
    updateUser,
    updateUserSettings,
    linkTelegramAccount,
    unlinkTelegramAccount
} from "@/backend/db/operations";
import { getDb } from "@/backend/db";
import { userSettings } from "@/backend/db/schema";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { canUseTelegram, UserTier } from "@/lib/tier-gate";
import { sendTelegramMessage } from "@/lib/telegram";
import { hashPin } from "@/lib/security";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        let user = await getUserById(userId);
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        // ── Tier Expiry Check ─────────────────────────────────────────
        if (user.tierExpiresAt && user.tier !== "starter") {
            const now = new Date();
            if (new Date(user.tierExpiresAt) < now) {
                // Tier expired → auto-downgrade to starter
                const updatedUser = await updateUser(userId, { tier: "starter", tierExpiresAt: null });
                if (updatedUser) user = updatedUser;
            }
        }
        // ─────────────────────────────────────────────────────────────

        let settings = await getUserSettings(userId);
        if (!settings) {
            const db = getDb();
            settings = await db.insert(userSettings).values({
                userId,
                hourlyRate: 50000,
                hideBalance: false,
                hasCompletedOnboarding: false,
            }).returning().get();
        }

        if (!settings) {
            throw new Error("Failed to load or create user settings");
        }

        const goals = await getGoals(userId);
        const streak = await getUserStreak(userId);
        const achievements = await getUserAchievements(userId);

        return NextResponse.json({
            success: true,
            data: {
            user: {
                ...user,
                tier: user.tier || "starter"
            },
                settings: {
                    id: settings.id,
                    userId: settings.userId,
                    hourlyRate: settings.hourlyRate,
                    monthlyIncome: settings.monthlyIncome,
                    primaryGoalId: settings.primaryGoalId,
                    isAppLockEnabled: settings.isAppLockEnabled,
                    isBiometricEnabled: settings.isBiometricEnabled,
                    hideBalance: settings.hideBalance,
                    financialPersona: settings.financialPersona,
                    updatedAt: settings.updatedAt,
                    hasPin: !!settings.securityPin,
                    autoLockTimeout: settings.autoLockTimeout,
                    hasCompletedOnboarding: settings.hasCompletedOnboarding
                },
                goals,
                streak,
                achievements
            }
        });
    } catch (error: any) {
        console.error("API Profile Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const action = formData.get("action") as string;

            if (action === "updateProfile") {
                const firstName = formData.get("firstName") as string;
                const lastName = formData.get("lastName") as string;
                const username = formData.get("username") as string;
                const whatsappId = formData.get("whatsappId") as string;
                const imageFile = formData.get("image") as File | null;
                const telegramIdStr = formData.get("telegramId") as string;
                const telegramId = telegramIdStr ? parseInt(telegramIdStr) : null;

                let imagePath: string | undefined = undefined;

                if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
                    const buffer = Buffer.from(await imageFile.arrayBuffer());
                    const ext = path.extname(imageFile.name) || ".png";
                    const filename = `avatar-${userId}${ext}`;
                    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    const filePath = path.join(uploadDir, filename);
                    fs.writeFileSync(filePath, buffer);
                    imagePath = `/uploads/avatars/${filename}?v=${Date.now()}`;
                }

                const user = await getUserById(userId);
                if (telegramId && user) {
                    if (!canUseTelegram(user.tier as UserTier)) {
                        return NextResponse.json({
                            success: false,
                            message: "Fitur Telegram hanya tersedia untuk Sultan! 👑",
                        }, { status: 403 });
                    }

                    const linkResult = await linkTelegramAccount(userId, telegramId);
                    if (!linkResult.success) {
                        return NextResponse.json({
                            success: false,
                            message: linkResult.message,
                        }, { status: 400 });
                    }

                    await sendTelegramMessage(telegramId, `🎉 **Selamat Datang, ${firstName || "Sultan"}!**\n\nAkun Telegram kamu berhasil terhubung.`);
                } else if (telegramId === null) {
                    await unlinkTelegramAccount(userId);
                }

                await updateUser(userId, {
                    firstName,
                    lastName,
                    username,
                    whatsappId,
                    ...(imagePath && { image: imagePath }),
                    ...(telegramId === null && { telegramId: null })
                });
            } else if (action === "updateFinancial") {
                const hourlyRate = formData.get("hourlyRate");
                const primaryGoalId = formData.get("primaryGoalId");

                await updateUserSettings(userId, {
                    hourlyRate: hourlyRate ? parseFloat(hourlyRate.toString()) : undefined,
                    primaryGoalId: primaryGoalId ? parseInt(primaryGoalId.toString()) : null,
                    autoLockTimeout: formData.get("autoLockTimeout") ? parseInt(formData.get("autoLockTimeout")!.toString()) : undefined,
                });
            }
        } else {
            // Handle JSON body - wrap in try-catch to handle empty/invalid JSON
            const contentType = req.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                // If not JSON and not FormData, skip body parsing
                console.warn("Unsupported content type:", contentType);
            } else {
                try {
                    const body = await req.json();
                    const { type, ...data } = body;
                
                    if (type === "profile") {
                        await updateUser(userId, data);
                    } else if (type === "telegram") {
                        const telegramId = parseInt(String(data.telegramId || ""), 10);
                        if (!telegramId) {
                            return NextResponse.json({
                                success: false,
                                message: "ID Telegram tidak valid.",
                            }, { status: 400 });
                        }

                        const user = await getUserById(userId);
                        if (!user || !canUseTelegram(user.tier as UserTier)) {
                            return NextResponse.json({
                                success: false,
                                message: "Fitur Telegram hanya tersedia untuk Sultan! 👑",
                            }, { status: 403 });
                        }

                        const linkResult = await linkTelegramAccount(userId, telegramId);
                        if (!linkResult.success) {
                            return NextResponse.json({
                                success: false,
                                message: linkResult.message,
                            }, { status: 400 });
                        }

                        await sendTelegramMessage(telegramId, "🎉 **Selamat Datang!**\n\nAkun Telegram kamu berhasil terhubung dengan Monev.");
                    } else if (type === "settings") {
                        const settingsData = { ...data };

                        if (typeof settingsData.securityPin === "string") {
                            if (settingsData.securityPin.length === 6) {
                                settingsData.securityPin = await hashPin(settingsData.securityPin);
                            } else if (!settingsData.securityPin) {
                                delete settingsData.securityPin;
                            }
                        }

                        if (typeof settingsData.decoyPin === "string") {
                            if (settingsData.decoyPin.length === 6) {
                                settingsData.decoyPin = await hashPin(settingsData.decoyPin);
                            } else if (!settingsData.decoyPin) {
                                settingsData.decoyPin = null;
                            }
                        }

                        await updateUserSettings(userId, settingsData);
                    } else if (type === "disconnectTelegram") {
                        await unlinkTelegramAccount(userId);
                    }
                } catch (parseError: any) {
                    console.error("API Profile JSON Update Error:", parseError);
                    return NextResponse.json({
                        success: false,
                        message: parseError?.message || "Gagal menyimpan profil.",
                    }, { status: 400 });
                }
            }
        }

        revalidatePath("/profile");
        revalidatePath("/dashboard");

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Profile Update Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
