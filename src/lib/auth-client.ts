"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
    basePath: "/api/auth",
});

type AppSession = {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        tier?: "starter" | "pro" | "sultan" | "benefactor";
    };
    session?: unknown;
};

type ClientSession = ReturnType<typeof authClient.useSession> & {
    data: AppSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
    update: () => unknown;
};

export function useSession(): ClientSession {
    const session = authClient.useSession();
    return {
        ...session,
        data: session.data as AppSession | null,
        status: session.isPending ? "loading" : session.data ? "authenticated" : "unauthenticated",
        update: session.refetch,
    } as ClientSession;
}

export async function signIn(provider: string, options?: Record<string, unknown>) {
    if (provider === "google") {
        return authClient.signIn.social({
            provider: "google",
            callbackURL: String(options?.redirectTo || options?.callbackUrl || "/dashboard"),
        });
    }

    if (provider === "credentials") {
        return authClient.signIn.email({
            email: String(options?.email || ""),
            password: String(options?.password || ""),
            callbackURL: String(options?.redirectTo || options?.callbackUrl || "/dashboard"),
        });
    }

    if (provider === "mobile-handoff") {
        return fetch("/api/auth/mobile-handoff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: options?.token }),
        }).then(async (response) => response.ok ? { error: null } : { error: await response.text() });
    }

    throw new Error(`Unsupported sign-in provider: ${provider}`);
}

export async function signOut(options?: { redirectTo?: string; callbackUrl?: string }) {
    const callbackURL = options?.redirectTo || options?.callbackUrl || "/login";
    return authClient.signOut({ fetchOptions: { onSuccess: () => window.location.assign(callbackURL) } });
}

export const signUp = authClient.signUp;
