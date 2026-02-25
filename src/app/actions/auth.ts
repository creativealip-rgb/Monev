"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

import bcrypt from "bcryptjs";
import { users, verificationTokens, passwordResetTokens } from "@/backend/db/schema";
import { getDb } from "@/backend/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mailer";

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {

        await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }
}

export async function register(prevState: { error?: string }, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!email || !password || !name || !confirmPassword) {
        return { error: "Semua field wajib diisi" };
    }

    if (password !== confirmPassword) {
        return { error: "Password dan konfirmasi password tidak cocok" };
    }

    if (password.length < 6) {
        return { error: "Password minimal 6 karakter" };
    }

    const db = getDb();

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
        return { error: "Email sudah terdaftar" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.insert(users).values({
            name,
            firstName: name, // Also set firstName for dashboard display
            email,
            password: hashedPassword,
            username: email.split("@")[0],
            // telegramId is optional in schema, so we omit it
        });

        // Generate verification token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

        await db.insert(verificationTokens).values({
            identifier: email,
            token,
            expiresAt,
        });

        // Send verification email
        const emailResult = await sendVerificationEmail(email, token);
        if (emailResult.error) {
            console.error("Failed to send verification email:", emailResult.error);
            // We can still proceed, but ideally we'd want to handle this gracefully
        }

    } catch (e) {
        console.error("Registration error:", e);
        return { error: "Gagal membuat akun. Silakan coba lagi." };
    }

    return { success: true };
}

export async function serverSignOut() {
    await signOut({ redirectTo: "/login" });
}

export async function signInWithGoogle() {
    try {
        await signIn("google", { redirectTo: "/dashboard" });
    } catch (error) {
        if (error instanceof AuthError) {
            return "Gagal login dengan Google. Silakan coba lagi.";
        }
        throw error;
    }
}

export async function requestPasswordReset(prevState: { error?: string, success?: boolean }, formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) {
        return { error: "Email wajib diisi" };
    }

    const db = getDb();

    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
        if (!existingUser) {
            // Kita return success agar tidak bisa ditebak emailnya ada atau tidak
            return { success: true };
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 jam

        await db.insert(passwordResetTokens).values({
            identifier: email,
            token,
            expiresAt,
        });

        const emailResult = await sendPasswordResetEmail(email, token);
        if (emailResult.error) {
            console.error("Failed to send reset email:", emailResult.error);
            return { error: "Gagal mengirim email reset password." };
        }

        return { success: true };
    } catch (e) {
        console.error("Request reset error:", e);
        return { error: "Terjadi kesalahan. Silakan coba lagi nanti." };
    }
}

export async function resetPassword(prevState: { error?: string, success?: boolean }, formData: FormData) {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password || !confirmPassword) {
        return { error: "Semua field wajib diisi." };
    }

    if (password !== confirmPassword) {
        return { error: "Password tidak cocok." };
    }

    if (password.length < 6) {
        return { error: "Password minimal 6 karakter." };
    }

    const db = getDb();

    try {
        const existingToken = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).get();

        if (!existingToken) {
            return { error: "Token reset password tidak valid atau kadaluarsa." };
        }

        if (new Date(existingToken.expiresAt) < new Date()) {
            return { error: "Token reset password sudah kadaluarsa." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.select().from(users).where(eq(users.email, existingToken.identifier)).get();

        if (!user) {
            return { error: "Pengguna tidak ditemukan." };
        }

        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, user.id));

        await db.delete(passwordResetTokens)
            .where(eq(passwordResetTokens.id, existingToken.id));

        return { success: true };
    } catch (e) {
        console.error("Reset password error:", e);
        return { error: "Terjadi kesalahan saat mereset password." };
    }
}
