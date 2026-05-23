import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb } from "@/backend/db";
import * as schema from "@/backend/db/schema";
import { users } from "@/backend/db/schema";
import type { UserTier } from "@/lib/tier-gate";

type AppSession = {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        tier?: UserTier;
        sessionToken?: string;
    };
    session?: { token?: string } | unknown;
};

const trustedOrigins = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3100",
    "http://127.0.0.1:3100",
].filter(Boolean) as string[];

export const betterAuthInstance = betterAuth({
    appName: "Monev",
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustedOrigins,
    database: drizzleAdapter(getDb(), {
        provider: "sqlite",
        schema,
        usePlural: false,
    }),
    advanced: {
        database: {
            generateId: false,
        },
        cookiePrefix: "monev",
        useSecureCookies: process.env.NODE_ENV === "production",
    },
    user: {
        modelName: "users",
        fields: {
            emailVerified: "emailVerified",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
        additionalFields: {
            username: { type: "string", required: false },
            firstName: { type: "string", required: false },
            tier: { type: "string", required: false, defaultValue: "starter" },
            isAdmin: { type: "boolean", required: false, defaultValue: false },
            isActive: { type: "boolean", required: false, defaultValue: true },
        },
    },
    session: {
        modelName: "authSessions",
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
    },
    account: {
        modelName: "authAccounts",
    },
    verification: {
        modelName: "authVerifications",
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
        password: {
            hash: (password) => bcrypt.hash(password, 10),
            verify: ({ hash, password }) => bcrypt.compare(password, hash),
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const email = user.email ?? "";
                    const name = user.name || email.split("@")[0] || "Pengguna Monev";
                    return {
                        data: {
                            ...user,
                            name,
                            firstName: name,
                            username: email ? email.split("@")[0] : undefined,
                            tier: "starter",
                            isActive: true,
                        },
                    };
                },
            },
        },
    },
    plugins: [nextCookies()],
});

export async function auth(): Promise<AppSession | null> {
    const session = await betterAuthInstance.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) return null;

    const db = getDb();
    const userId = Number(session.user.id);
    const dbUser = Number.isNaN(userId)
        ? null
        : await db.select().from(users).where(eq(users.id, userId)).get();

    return {
        ...session,
        user: {
            ...session.user,
            id: session.user.id.toString(),
            name: dbUser?.name ?? session.user.name,
            email: dbUser?.email ?? session.user.email,
            image: dbUser?.image ?? session.user.image,
            tier: (dbUser?.tier as UserTier | undefined) ?? "starter",
            sessionToken: "session" in session && typeof session.session === "object" && session.session && "token" in session.session
                ? String(session.session.token)
                : undefined,
        },
    };
}

export async function signOut(options?: { redirectTo?: string }) {
    await betterAuthInstance.api.signOut({ headers: await headers() });
    if (options?.redirectTo) redirect(options.redirectTo);
}

export async function signIn(provider: string, options?: Record<string, unknown>) {
    if (provider === "google") {
        const callbackURL = String(options?.redirectTo || options?.callbackUrl || "/dashboard");
        await betterAuthInstance.api.signInSocial({
            body: { provider: "google", callbackURL },
            headers: await headers(),
        });
        return;
    }

    if (provider === "credentials") {
        await betterAuthInstance.api.signInEmail({
            body: {
                email: String(options?.email || ""),
                password: String(options?.password || ""),
                callbackURL: String(options?.redirectTo || options?.callbackUrl || "/dashboard"),
            },
            headers: await headers(),
        });
        return;
    }

    throw new Error(`Unsupported sign-in provider: ${provider}`);
}

export const handlers = {
    GET: betterAuthInstance.handler,
    POST: betterAuthInstance.handler,
};
