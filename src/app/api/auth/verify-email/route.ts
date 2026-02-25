import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, verificationTokens } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=MissingToken", request.url));
    }

    const db = getDb();

    try {
        // Find token and check expiry
        const existingToken = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token)).get();

        if (!existingToken) {
            return NextResponse.redirect(new URL("/login?error=InvalidToken", request.url));
        }

        const isExpired = new Date(existingToken.expiresAt) < new Date();
        if (isExpired) {
            return NextResponse.redirect(new URL("/login?error=TokenExpired", request.url));
        }

        // Find user by identifier (email)
        const user = await db.select().from(users).where(eq(users.email, existingToken.identifier)).get();

        if (!user) {
            return NextResponse.redirect(new URL("/login?error=UserNotFound", request.url));
        }

        // Mark user email as verified
        await db.update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, user.id));

        // Delete the token
        await db.delete(verificationTokens)
            .where(eq(verificationTokens.id, existingToken.id));

        // Successfully verified
        return NextResponse.redirect(new URL("/login?verified=true", request.url));

    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.redirect(new URL("/login?error=VerificationFailed", request.url));
    }
}
