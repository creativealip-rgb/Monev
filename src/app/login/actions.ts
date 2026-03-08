"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(email: string, password: string) {
    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, error: "Email atau password salah" };
        }
        // next-auth v5 throws a NEXT_REDIRECT error on successful login
        // even with redirect: false in some cases — treat as success
        if (error instanceof Error && error.message?.includes("NEXT_REDIRECT")) {
            return { success: true };
        }
        throw error;
    }
}
