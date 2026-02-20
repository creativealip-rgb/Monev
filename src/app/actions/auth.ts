"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

import bcrypt from "bcryptjs";
import { users } from "@/backend/db/schema";
import { getDb } from "@/backend/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

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
    } catch (e) {
        console.error("Registration error:", e);
        return { error: "Gagal membuat akun. Silakan coba lagi." };
    }

    redirect("/login");
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
