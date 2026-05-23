"use server";

import { signIn } from "@/auth";

export async function loginAction(email: string, password: string) {
    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        console.error("Login action error:", error);
        return { success: false, error: "Email atau password salah" };
    }
}
