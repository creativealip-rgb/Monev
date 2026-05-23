import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/backend/db";
import { authSessions, users } from "@/backend/db/schema";
import { verifyMobileHandoffToken } from "@/lib/mobile-auth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getAuthSecret() {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("Missing BETTER_AUTH_SECRET/AUTH_SECRET/NEXTAUTH_SECRET");
    return secret;
}

async function signCookieValue(value: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(getAuthSecret()),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
    return `${value}.${Buffer.from(signature).toString("base64")}`;
}

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        if (!token || typeof token !== "string") {
            return NextResponse.json({ success: false, error: "Missing handoff token" }, { status: 400 });
        }

        const userId = Number(await verifyMobileHandoffToken(token));
        if (!Number.isInteger(userId)) {
            return NextResponse.json({ success: false, error: "Invalid handoff token" }, { status: 401 });
        }

        const db = getDb();
        const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const sessionToken = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000);

        await db.insert(authSessions).values({
            token: sessionToken,
            userId: user.id,
            expiresAt,
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
            userAgent: req.headers.get("user-agent"),
            createdAt: now,
            updatedAt: now,
        });

        const isProduction = process.env.NODE_ENV === "production";
        const response = NextResponse.json({ success: true });
        response.cookies.set(isProduction ? "__Secure-monev.session_token" : "monev.session_token", await signCookieValue(sessionToken), {
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
            path: "/",
            maxAge: SESSION_MAX_AGE,
        });
        return response;
    } catch (error) {
        console.warn("[MobileAuth] Handoff failed", error);
        return NextResponse.json({ success: false, error: "Invalid or expired handoff token" }, { status: 401 });
    }
}
